import Expr, { Define } from "./ast.js"
import { Token } from './lexer.js'

class Parser {

  constructor(tokenGenerator) {
    this.tokens = tokenGenerator
    this.read = []
    this.errors = []
  }

  reportError(error) {
    debugger
    this.errors.push(new Error(error))
  }

  ifLookAhead(type1, type2) {
    this.fillLookahead(arguments.length);
    if (this.read.length == 0) {
      debugger
    }
    return this.read[0].type == type1 && (!type2 || this.read[1].type == type2)
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
  
    if (type && !type == token.type) {
      this.reportError(error || `Expect token: ${type} Got: ${this.current()}`)
      return false
    }
  
    return token
  }
  
  fillLookahead(count) {
    while (this.read.length < count) {
      let token = this.tokens.next()
      if (token.value?.type == Token.Eof) {
        debugger
      }
      this.read.push(token.value);
    }
  }

  parse() {
    let expr = this.expression()
    this.consume(Token.Eof)
    return expr
  }

  expression() {
    return this.sequence()
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
        defines = this.parseDefines()
      } else {
        defines = [this.parseDefine()]
      }

      expr = new Expr.Bind(expr, defines)
    })

    return expr
  }

  assignment() {
    let [name, arrow] = this.match2(Token.Name, Token.Arrow)
    if (name && arrow) {
      let value = this.assignment()
      return new Expr.Var(name.text, value)
    }

    [name, arrow] = this.match2(Token.Name, Token.LongArrow)
    if (name && arrow) {
      let value = this.assignment()
      return new Expr.Set(name.text, value)
    }

    return this.cascade()
  }

  cascade() {
    return this.keyword()
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

    if (token = this.match(Token.Name)) {
      return new Expr.Name(token.text)
    }

    if (token = this.match(Token.Self)) {
      return new Expr.Self()
    }

    // TODO(bob): Move this below sequence in the grammar so that you
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
        defines = this.parseDefines()
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
  
    if (this.match(Token.LeftBrace)) {
      let params = []
      if (this.match(Token.Pipe)) {
        this.whileMatchDo(Token.Name, name => {
          params.push(name.text)
        })
        this.consume(Token.Pipe, "Expect '|' to end argument list.")
      }

      let body = this.expression()
      this.consume(Token.RightBrace, "Expect '}' to end block.")

      return new Expr.Block(params, body)
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

    this.reportError(`Could not parse: ${this.current()}`)
    this.consume()

    return new Expr.Error()
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

  parseDefines() {
    let defines = []
    let define

    while (define = this.parseDefine()) {
      defines.push(define)

      if (this.match(Token.RightParen)) return defines
      this.consume(Token.Comma)
      if (this.match(Token.RightParen)) return defines
    }

    return new Expr.Error()
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

    if (operator = this.match(Token.Operator)) {
      let param = this.consume(Token.Name)?.text
      let body = this.parseDefineMethod([param])
      return new Define(operator.text, body, true)
    }

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

    this.reportError(`Unexpected token '${this.current()}' after bind.`)
  }

  parseDefineMethod(params) {
    this.consume(Token.LeftBrace, "Expect block body for method.")
    let body = this.expression()
    this.consume(Token.RightBrace, "Expect '}' after method body.")
    return new Expr.Block(params, body)
  }

}

export default Parser
