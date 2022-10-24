import Expr, { Define } from "./ast.js"

class PrettyPrinter {
  constructor(buffer=[], indent="") {
    this._buffer = buffer
    this._indent = indent
  }

  toString() {
    let result = ""
    for (let item of this._buffer) {
      result += item
    }
    return result
  }

  write(s) {
    this._buffer.push(s)
  }

  writeLine(s="") {
    this._buffer.push(s + "\n" + this._indent)
  }

  indent() {
    this._indent += "  "
  }

  dedent() {
    this._indent = this._indent.substring(2)
  }
}

Expr.prototype.toString = function() {
  return this.prettyPrint()
}

Expr.prototype.prettyPrint = function() {
  let printer = new PrettyPrinter()
  this.printTo(printer)
  return printer.toString()
}

Expr.prototype.printTo = function(printer) {
  printer.write("<not implemented>")
  throw new Error()
}

Expr.Array.prototype.printTo = function(printer) {
  printer.write("#[")

  for (let element of this.elements) {
    element.printTo(printer)
    printer.write(", ")
  }

  printer.write("]")
}

Expr.Bind.prototype.printTo = function(printer) {
  this.receiver.printTo(printer)
  printer.write(" :: ")

  if (this.defines.length == 1) {
    this.defines[0].printTo(printer)
  } else {
    printer.writeLine("")
    this.printDefinesTo(printer)
    printer.write(")")
  }
}

Expr.Block.prototype.printTo = function(printer) {
  printer.write("{ ")

  if (this.params.length ) {
    printer.write("|")

    this.params.forEach((p, i) =>  {
      if (i != 0) printer.write(" ")
      printer.write(p)
    })

    printer.write("|")
  }
  printer.indent()
  printer.writeLine("")

  this.body.printTo(printer)

  printer.dedent()
  printer.writeLine("")
  printer.write("}")
}

Expr.prototype.printDefinesTo = function(printer) {
  // semi hack to put this on Expr directly...
  this.defines.forEach((d, i) => {
    if (i != 0) printer.writeLine()
    d.printTo(printer)
  })
}

Expr.Error.prototype.printTo = function(printer) {
  printer.write("<parse error>")
}

Define.prototype.printTo = function(printer) {
  printer.write(this.name)

  if (this.isMethod) {
    // TODO(bob): Pull out params.
    this.body.printTo(printer)
  } else {
    printer.write(" <- ")
    this.body.printTo(printer)
  }
}

Expr.Message.prototype.printTo = function(printer) {
  printer.write("(")

  if (this.receiver) {
    this.receiver.printTo(printer)
    printer.write(" ")
  }

  let splitName = this.name.split(":");
  let suffix = " "
  if (splitName.length > 1) { 
    splitName = splitName.slice(0, -1)
    suffix = ": "
  }
  
  this.args.forEach((n, i) => {
    if (i != 0) printer.write(" ")
    printer.write(splitName[i] + suffix)
    n.printTo(printer)
  })

  printer.write(")")
}

Expr.Name.prototype.printTo = function(printer) {
  printer.write(this.name)
}

Expr.Number.prototype.printTo = function(printer) {
  printer.write(this.value)
}

Expr.Object.prototype.printTo = function(printer) {
  if (!this.parent) {
    printer.writeLine("[")
  } else {
    printer.write("[ |")
    this.parent.printTo(printer)
    printer.writeLine("|")
  }

  this.printDefinesTo(printer)

  printer.write("]")
}

Expr.Self.prototype.printTo = function(printer) {
  printer.write("self")
}

Expr.Sequence.prototype.printTo = function(printer) {
  this.exprs.forEach((e, i) => {
    if (i != 0) printer.writeLine("")
    e.printTo(printer)
    printer.writeLine("")
  })
}

Expr.Set.prototype.printTo = function(printer) {
  printer.write(this.name)
  printer.write(" <-- ")
  this.value.printTo(printer)
}

Expr.String.prototype.printTo = function(printer) {
  printer.write(JSON.stringify(this.value))
}

Expr.Var.prototype.printTo = function(printer) {
  printer.write(this.name)
  printer.write(" <- ")
  this.value.printTo(printer)
}

export default PrettyPrinter
