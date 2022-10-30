class Token {
  constructor(type, text, span) {
    this.type = type
    this.text = text
    this.span = span
  }

  toString() {
    return `'${this.text}' (${this.type}) ${this.span}`
  }  
}

Token.None         = ""
Token.LeftParen    = "left paren"
Token.RightParen   = "right paren"
Token.LeftBracket  = "left bracket"
Token.RightBracket = "right bracket"
Token.LeftBrace    = "left brace"
Token.RightBrace   = "right brace"
Token.Comma        = "comma" // Includes newlines too.
Token.Semicolon    = "semicolon"
Token.Dot          = "dot"
Token.Pipe         = "pipe"
Token.Arrow        = "arrow"
Token.LongArrow    = "long arrow"
Token.Hash         = "hash"
Token.Bind         = "bind"
Token.Self         = "self"
Token.Undefined    = "undefined"
Token.Break        = "break"
Token.Return       = "return"
Token.Number       = "number"
Token.String       = "string"
Token.Name         = "name"
Token.Operator     = "operator"
Token.Keyword      = "keyword"
Token.IgnoreLine   = "ignore line"
Token.Eof          = "eof"
Token.Error        = "error"


class SourceSpan {
  constructor(file, start, end) {
    this.file = file
    this.start = start
    this.end = end
  }
  location() {
    let {line, column } = this.file.indexToPosition(this.start)
    let path = this.file.path
    return { path, line, column };
  }
  toString() {
    let { path, line, column } = this.location()
    return `${path}: ${line}, ${column}`
  }
}

class SourceFile {
  constructor(path, source) {
    this.path = path
    this.source = source
  }
  indexToPosition(index) {
    let line = 1, column = 1
    for (let i = 0; i < index; i++) {
      if (this.source[i] == "\n") {
        line++
        column = 1
      } else {
        column++
      }
    }
    return { line, column }
  }
}

String.prototype.alpha = function() {
  return "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_".includes(this)
}

String.prototype.operator = function() {
  return "-+=/<>?~!%^&*".includes(this)
}

String.prototype.identifier = function() {
  return this.alpha() || this.operator() || this.digit()
}

String.prototype.digit = function() {
  return "0123456789".includes(this)
}

String.prototype.whitespace = function() {
  return " \t".includes(this)
}


class Lexer {
  constructor(path, source) {
    this.file = new SourceFile(path, source)
    this.source = source
    this.pos = 0
    this.start = 0
    this.eatNewlines = true
  }

  *each(fn) {
    let token = this.nextToken()
    while (token.type != Token.Eof) {
      yield token
      token = this.nextToken()
    }
    return token
  }

  advance() {
    return this.source[this.pos++]
  }

  eof() {
    return this.pos >= this.source.length
  }

  advanceWhile(conditionFn) {
    while (!this.eof() && conditionFn(this.current())) {
      this.advance()
    }
  }

  current() {
    return this.source[this.pos]
  }

  next() {
    if (this.pos >= this.source.length - 1) {
      return ""
    } else {
      return this.source[this.pos + 1]
    }
  }

  // Reads the next token from the source and handles newlines.
  nextToken() {
    while(true) {
      if (this.eof()) {
        let span = new SourceSpan(this.file, this.pos, this.pos)
        return new Token(Token.Eof, "", span)
      }

      let token = this.nextTokenRaw()
      let done = true

      switch(token.type) {
        case Token.Comma:
          if (this.eatNewlines) {
            done = false
          } else {
            this.eatNewlines = true
          }
          break

        case Token.IgnoreLine: 
          done = false
          this.eatNewlines = true
          break

        case Token.Keyword:
        case Token.Operator:
        case Token.Pipe:
        case Token.Arrow:
        case Token.LongArrow:
        case Token.Semicolon:
        case Token.LeftParen:
        case Token.LeftBracket:
        case Token.LeftBrace: 
          this.eatNewlines = true
          break

        default: 
          this.eatNewlines = false
      }
      
      if (done) return token
    }
  }

  // Reads the next token from the source. Doesn't do any newline normalization.
  nextTokenRaw() {
    while (true) {
      this.start = this.pos
      let c = this.current()
      switch(c) {
        case "(": return this.singleToken(Token.LeftParen)
        case ")": return this.singleToken(Token.RightParen)
        case "[": return this.singleToken(Token.LeftBracket)
        case "]": return this.singleToken(Token.RightBracket)
        case "{": return this.singleToken(Token.LeftBrace)
        case "}": return this.singleToken(Token.RightBrace)
        case ",": return this.singleToken(Token.Comma)
        case "\n": return this.singleToken(Token.Comma)
        case "\\": return this.singleToken(Token.IgnoreLine)
        case ";": return this.singleToken(Token.Semicolon)
        case ".": return this.singleToken(Token.Dot)
        case "|": return this.singleToken(Token.Pipe)
        case "#": return this.singleToken(Token.Hash)

        case "\"":
          return this.readString()

        case "/": 
          this.advance()
          if (this.current() == "/") {
            this.advanceWhile(c => c != "\n")
            return this.singleToken(Token.Comma)
          } else if (this.current() == "*") {
            this.skipBlockComment()
          } else {
            return this.readOperator()
          }
          break

        case ":": 
          this.advance()
          if (this.current() == ":") {
            this.advance()
            return this.makeToken(Token.Bind)
          } else {
            return this.makeToken(Token.Keyword)
          }
          break

        case "-": 
          this.advance()
          if (this.current().digit()) {
            return this.readNumber()
          } else {
            return this.readOperator()
          }
          break
        
        default:
          if (c.whitespace()) {
            this.advanceWhile( c => c.whitespace() )
            break
          } else if (c.alpha()) {
            return this.readName()
          } else if (c.operator()) {
            return this.readOperator()
          } else if (c.digit()) {
            return this.readNumber()
          }

          // If we got here, we failed to handle the current character.
          return this.singleToken(Token.Error)
      }
    }
  }

  skipBlockComment() {
    this.advance()
    this.advance()

    let nesting = 1
    while (nesting > 0) {
      // TODO(bob): Unterminated comment, should return error.
      if (this.eof()) return

      switch(this.current() + this.next()) {
        case "/*":
          this.advance()
          this.advance()
          nesting++
          break
        case "*/":
          this.advance()
          this.advance()
          nesting--
          break
        default:
          this.advance()
      }
    }
  }

  readName() {
    this.advanceWhile(c => c.identifier())

    let type = Token.Name
    if (this.current() == ":") {
      this.advance()
      type = Token.Keyword
    }

    return this.makeToken(type)
  }

  readOperator() {
    let type = Token.Operator

    while (!this.eof() && this.current().operator() || this.current().alpha()) {
      if (this.current().alpha()) {
        type = Token.Name
      }
      this.advance()
    }

    if (this.current() == ":") {
      this.advance()
      type = Token.Keyword
    }

    return this.makeToken(type)
  }

  readString() {
    this.advance()

    let text = ""
    while (true) {
      if (this.eof()) return this.makeToken(Token.Error, "Unterminated string")

      if (this.current() == "\"") {
        this.advance()
        return this.makeToken(Token.String, text)
      }

      if (this.current() == "\\") {
        this.advance()

        if (this.eof()) return this.makeToken(Token.Error, "Unterminated string escape")
        
        let c = this.advance()
        switch (c) {
          case "n": 
            text += "\n"; break
          case "\"": 
            text += "\""; break
          case "\\": 
            text += "\\"; break
          case "t": 
            text += "\t"; break
          default:
            return this.makeToken(Token.Error, `Unrecognized string escape: '${c}'`)
        }
      } else {
        text += this.current()
        this.advance()
      }
    }
  }

  readNumber() {
    this.advanceWhile(c => c.digit())
    return this.makeToken(Token.Number)
  }

  singleToken(type) {
    this.advance()
    return this.makeToken(type)
  }

  makeToken(type, text) {
    if (!text) {
      text = this.source.substring(this.start, this.pos)

      switch (text) {
        case "<-":
          type = Token.Arrow; break
        case "<--":
          type = Token.LongArrow; break
        case "self":
          type = Token.Self; break
        case "undefined": 
          type = Token.Undefined; break
        case "return":
          type = Token.Return; break
      }  
    }

    let span = new SourceSpan(this.file, this.start, this.pos)
    return new Token(type, text, span)
  }
}

export { Token, Lexer }
