import Expr, { Define } from "./ast.js"
import { Token } from './lexer.js'

class ParseError extends Error {
  constructor(message, token) {
    super(message)
    this.token = token
    this.location = token && token.span.location()
  }
}

class Parser {

  constructor(tokenGenerator) {
    this.tokens = tokenGenerator
    this.read = []
    this.errors = []
  }

  reportError(error) {
    this.errors.push(error)
  }

  throwError(error, token) {
    throw new ParseError(error, token)
  }

  ifLookAhead(type1, type2) {
    this.fillLookahead(arguments.length);
    return this.read[0]?.type == type1 && (!type2 || this.read[1]?.type == type2)
  }
  
  
  match(type) {
    if (this.ifLookAhead(type)) {
      return this.consume()
    } else {
      return false
    }
  }

  match2(type1, type2) {
    if (this.ifLookAhead(type1, type2)) {
      return [this.consume(), this.consume()]
    } else {
      return []
    }
  }

  whileMatchDo(type, fn) {
    if (this.ifLookAhead(type)) {
      fn(this.consume());
      this.whileMatchDo(type, fn);
    }
  }
  
  current() {
    return this.read[0];
  }
  
  consume(type, error) {
    this.fillLookahead(1);
    let token = this.read.shift();
  
    if (type && type != token?.type) {
      this.throwError(error || `Expect token: ${type} Got: ${token}`, token)
      return false
    }
  
    return token
  }
  
  fillLookahead(count) {
    while (this.read.length < count) {
      let token = this.tokens.next()
      this.read.push(token.value);
    }
  }

  parse() {
    let expr = this.expression()
    this.consume(Token.Eof)
    return expr
  }

  expression() {
    try {
      return this.sequence()
    } catch(e) {
      this.reportError(e)
      return new Expr.Error(e)
    }
  }

  sequence() {
    let exprs = this.parseSequence()

    if (exprs.length == 1) {
      return exprs[0]
    }

    return new Expr.Sequence(exprs)
  }

  bind() {
    let expr = this.assignment()

    this.whileMatchDo(Token.Bind, () => {
      let defines
      if (this.ifLookAhead(Token.LeftParen)) {
        this.consume(Token.LeftParen)
        defines = this.parseDefines(Token.RightParen)
      } else {
        defines = [this.parseDefine()]
      }

      expr = new Expr.Bind(expr, defines)
    })

    return expr
  }

  assignment() {
    let expr = this.cascade()

    let arrow
    if (arrow = this.match(Token.Arrow)) {
      if (expr instanceof Expr.Scheme) {
        return new Expr.SchemeCreate(expr.scheme, expr.path, this.assignment())
      }
      if (expr instanceof Expr.Name) {
        return new Expr.Var(expr.name, this.assignment())
      }
      this.throwError("Invalid target for <-", arrow)
    }

    if (arrow = this.match(Token.LongArrow)) {
      if (expr instanceof Expr.Scheme) {
        return new Expr.SchemeUpdate(expr.scheme, expr.path, this.assignment())
      }
      if (expr instanceof Expr.Name) {
        return new Expr.Set(expr.name, this.assignment())
      }
      this.throwError("Invalid target for <--", arrow)
    }

    return expr
  }

  cascade() {
    let expr = this.keyword()

    if (expr instanceof Expr.Message) {
      let messages = [{name: expr.name, args: expr.args}]

      this.whileMatchDo(Token.Semicolon, () => {
        let token
        let args = []
        if (token = this.match(Token.Name)) {
          messages.push({name: token.text, args: args})
        } else if (token = this.match(Token.Operator)) {
          args.push(this.unary())
          messages.push({name: token.text, args: args})
        } else if (this.ifLookAhead(Token.Keyword)) {
          let name = ""
          this.whileMatchDo(Token.Keyword, keyword => {
            name += keyword.text
            args.push(this.operator())
          })
          messages.push({name: name, args: args})
        }
      })

      if (messages.length == 1) {
        expr = expr
      } else {
        expr = new Expr.Cascade(expr.receiver, messages)
      }
    }

    return expr
  }

  keyword() {
    let expr = this.operator()
    let message = ""
    let args = []

    this.whileMatchDo(Token.Keyword, keyword => {
      message += keyword.text
      args.push(this.operator())
    })

    if (args.length > 0) {
      return new Expr.Message(expr, message, args)
    } else {
      return expr
    }
  }

  operator() {
    let expr = this.unary()

    this.whileMatchDo(Token.Operator, operator => {
      let right = this.unary()
      expr = new Expr.Message(expr, operator.text, [right])
    })

    return expr
  }

  unary() {
    let expr = this.primary()

    this.whileMatchDo(Token.Name, name => {
      expr = new Expr.Message(expr, name.text, [])
    })

    return expr
  }

  primary() {
    let token
    if (token = this.match(Token.Number)) {
      return new Expr.Number(token.text)
    }

    if (token = this.match(Token.String)) {
      return new Expr.String(token.text)
    }

    if (token = this.match(Token.StringPart)) {
      return this.parseInterpolatedString(token.text)
    }

    if (token = this.match(Token.Scheme)) {
      let pathExpr = this.parseSchemePath()
      return new Expr.Scheme(token.text, pathExpr)
    }

    if (token = this.match(Token.Name)) {
      return new Expr.Name(token.text)
    }

    if (token = this.match(Token.Self)) {
      return new Expr.Self()
    }

    if (this.match(Token.Await)) {
      return new Expr.Await(this.assignment())
    }

    if (this.match(Token.Return)) {
      let result
      if (this.ifLookAhead(Token.Line) || 
          this.ifLookAhead(Token.RightParen) || 
          this.ifLookAhead(Token.RightBrace) || 
          this.ifLookAhead(Token.RightBracket)) {
        result = null
      } else {
        result = this.assignment()
      }

      return new Expr.Return(result)
    }

    if (this.match(Token.LeftParen)) {
      let expr = this.expression()
      this.consume(Token.RightParen, "Expect closing ')'.")
      return expr
    }

    if (this.match(Token.LeftBracket)) {
      // Object literal
      let parent
      if (this.match(Token.Pipe)) {
        parent = this.assignment()
        this.consume(Token.Pipe, "Expect closing '|' after parent.")
      } else {
        parent = new Expr.Name("Object")
      }

      let defines = []
      if (!this.match(Token.RightBracket)) {
        defines = this.parseDefines(Token.RightBracket)
      }

      return new Expr.Object(parent, defines)
    }

    if (this.match(Token.Hash)) {
      this.consume(Token.LeftBracket, "Expect '[' to begin array literal.")

      let elements = []
      if (!this.match(Token.RightBracket)) {
        elements = this.parseSequence()
        this.consume(Token.RightBracket, "Expect ']' to end array literal.")
      }

      return new Expr.Array(elements)
    }
  
    let [at, brace] = this.match2(Token.At, Token.LeftBrace)
    if ((at && brace) || (brace = this.match(Token.LeftBrace))) {
      let params = []
      if (this.match(Token.Pipe)) {
        this.whileMatchDo(Token.Name, name => {
          params.push(name.text)
        })
        this.consume(Token.Pipe, "Expect '|' to end argument list.")
      }

      let body = this.expression()
      this.consume(Token.RightBrace, "Expect '}' to end block.")

      return new Expr.Block(params, body, at != undefined)
    }

    if (this.ifLookAhead(Token.Keyword)) {
      let message = ""
      let args = []
      this.whileMatchDo(Token.Keyword, keyword => {
        message += keyword.text
        args.push(this.operator())
      })

      return new Expr.Message(null, message, args)
    }

    this.throwError(`Could not parse: ${this.current()}`, this.current())
  }

  parseSequence() {
    let exprs = [this.bind()]

    this.whileMatchDo(Token.Comma, () => {
      if (this.ifLookAhead(Token.RightParen)) return
      if (this.ifLookAhead(Token.RightBracket)) return
      if (this.ifLookAhead(Token.RightBrace)) return
      if (this.ifLookAhead(Token.Eof)) return

      exprs.push(this.bind())
    })

    return exprs
  }

  parseDefines(closingToken) {
    let defines = []
    let define

    while (define = this.parseDefine()) {
      defines.push(define)

      if (this.match(closingToken)) return defines
      this.consume(Token.Comma)
      if (this.match(closingToken)) return defines
    }
  }

  parseDefine() {
    let name, arrow, operator

    // Define a field on an object
    [name, arrow] = this.match2(Token.Name, Token.Arrow)
    if (name && arrow) {
      let body = this.assignment()
      return new Define(name.text, body, false)
    }

    // Define a method on an object
    if (name = this.match(Token.Name)) {
      let body = this.parseDefineMethod([])
      return new Define(name.text, body, true)
    }

    // Define an operator method on an object
    if (operator = this.match(Token.Operator)) {
      let param = this.consume(Token.Name)?.text
      let body = this.parseDefineMethod([param])
      return new Define(operator.text, body, true)
    }

    // Parse named method
    if (this.ifLookAhead(Token.Keyword)) {
      let name = ""
      let params = []

      this.whileMatchDo(Token.Keyword, keyword => {
        name += keyword.text
        params.push(this.consume(Token.Name)?.text)
      })

      let body = this.parseDefineMethod(params)
      return new Define(name, body, true)
    }

    this.throwError(`Unexpected token '${this.current()}' after bind.`, this.current())
  }

  parseInterpolatedString(firstText) {
    let parts = []
    if (firstText.length > 0) parts.push(new Expr.String(firstText))
    parts = parts.concat(this.parseInterpolationParts())
    return this.buildConcatenation(parts)
  }

  parseSchemePath() {
    let token
    if (token = this.match(Token.StringPart)) {
      let parts = []
      if (token.text.length > 0) parts.push(new Expr.String(token.text))
      parts = parts.concat(this.parseInterpolationParts())
      return this.buildConcatenation(parts)
    }

    token = this.consume(Token.String, "Expect path after scheme.")
    return new Expr.String(token.text)
  }

  parseInterpolationParts() {
    let parts = []
    parts.push(new Expr.Message(this.expression(), "to-string", []))

    let token
    while (token = this.match(Token.StringPart)) {
      if (token.text.length > 0) parts.push(new Expr.String(token.text))
      parts.push(new Expr.Message(this.expression(), "to-string", []))
    }

    token = this.consume(Token.String, "Expect end of interpolation.")
    if (token.text.length > 0) parts.push(new Expr.String(token.text))

    return parts
  }

  buildConcatenation(parts) {
    if (parts.length == 0) return new Expr.String("")
    let result = parts[0]
    for (let i = 1; i < parts.length; i++) {
      result = new Expr.Message(result, "+", [parts[i]])
    }
    return result
  }

  parseDefineMethod(params) {
    let async = this.match(Token.At)
    this.consume(Token.LeftBrace, "Expect block body for method.")
    
    let body
    if (!this.ifLookAhead(Token.RightBrace)) {
      body = this.expression()
    }

    this.consume(Token.RightBrace, "Expect '}' after method body.")

    return new Expr.Block(params, body || new Expr.Name("nil"), async)
  }

}

export default Parser
