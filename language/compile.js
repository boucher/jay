import Expr, { Define } from "./ast.js"

class Compiler {
  constructor(inline=false) {
    this._buffer = []
    this._indent = ""
    this.inline = inline
    this.topLevel = true
  }

  static compile(expression, inline=false) {
    let compiler =new Compiler(inline)
    //compiler.writeLine("(function($Object, $Arrays, $Ether, $Blocks, $Fibers, $Numbers, $Strings, True, False, Nil){")
    !inline && compiler.writeLine("(function(){")
    expression.compileTo(compiler)
    !inline && compiler.writeLine("\n})()")
    //compiler.writeLine("\n})({}, {}, {}, {}, {}, {}, {}, {}, {}, {})")
    //console.debug(compiler.toString())
    return compiler.toString()
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

Expr.prototype.compileTo = function(compiler) {
  throw new Error("<not implemented>")
}

Expr.Array.prototype.compileTo = function(compiler) {
  if (this.elements.length == 0) {
    return compiler.write("[]")
  }

  compiler.write("[")
  compiler.indent()
  compiler.writeLine()

  this.elements.forEach((element, i) => {
    if (i !== 0) compiler.writeLine(", ")
    element.compileTo(compiler)
  })

  compiler.dedent()
  compiler.writeLine()
  compiler.write("]")
}

Expr.Bind.prototype.compileTo = function(compiler) {
  compiler.write(`Object.assign(`)
  this.receiver.compileTo(compiler)

  compiler.indent()
  compiler.writeLine(", {")

  this.defines.forEach((d, i) => {
    d.compileTo(compiler)
  })

  compiler.dedent()
  compiler.writeLine("")

  compiler.write("})")
}

Expr.Block.prototype.compileTo = function(compiler, captureThis=true) {
  if (captureThis) {
    compiler.write("((")
  } else {
    compiler.write("(function(")
  }

  this.params.forEach((p, i) =>  {
    if (i != 0) compiler.write(", ")
    compiler.write(convertName(p))
  })

  if (captureThis) {
    compiler.write(") => {")
  } else {
    compiler.write(") {")
  }

  compiler.indent()
  compiler.writeLine("")

  if (this.body instanceof Expr.Sequence && this.body.exprs.length > 1) {
    let existing = this.body.exprs[this.body.exprs.length - 1]

    this.body.exprs[this.body.exprs.length - 1] = {
      compileTo: function(compiler) {
        compiler.write("return (")
        existing.compileTo(compiler)
        compiler.write(")")
      }
    }

    this.body.compileTo(compiler)
  } else if (this.body instanceof Expr.Set || this.body instanceof Expr.Var) {
    this.body.compileTo(compiler)
    compiler.writeLine("")
    compiler.write(`return ${this.body.name}`)
  } else {
    compiler.write("return (")
    this.body.compileTo(compiler)
    compiler.write(")")
  }

  compiler.dedent()
  compiler.writeLine("")
  compiler.write("})")
}

Expr.Error.prototype.compileTo = function(compiler) {
  throw new Error("Cannot compile, encounted error: " + this.error)
}

Define.prototype.compileTo = function(compiler) {
  if (!this.isMethod) {
    // we are defining a field and an accessor at the same time (a property)
    if (this.name.charAt(0) != "_") {
      compiler.write(`"${this.name}": function(){ return this._${convertName(this.name)} },`)
      compiler.writeLine("")
    }
    
    compiler.write(`"_${convertName(this.name)}": `)
  } else {
    compiler.write(`"${this.name}": `)
  }
  
  this.body.compileTo(compiler, false)

  compiler.writeLine(",")
}

Expr.Message.prototype.compileTo = function(compiler) {
  let id
  if (this.receiver) {
    compiler.write("(")
    this.receiver.compileTo(compiler)
    compiler.write(")")
  } else {
    compiler.write("$Ether")
  }

  compiler.write(`["${this.name}"](`)

  this.args.forEach((n, i) => {
    if (i != 0) compiler.write(", ")
    n.compileTo(compiler)
  })

  compiler.write(")")
}

Expr.Name.prototype.compileTo = function(compiler) {
  compiler.write(convertName(this.name))
}

Expr.Number.prototype.compileTo = function(compiler) {
  compiler.write(this.value)
}

Expr.Object.prototype.compileTo = function(compiler) {
  compiler.indent()

  if (this.parent) {
    compiler.write("Object.assign(Object.create(")
    this.parent.compileTo(compiler)
    compiler.writeLine("), {")
  } else {
    compiler.writeLine("({")
  }

  this.defines.forEach((d, i) => {
    d.compileTo(compiler)
  })

  compiler.dedent()

  compiler.writeLine("")
  compiler.write("})")
}

Expr.Self.prototype.compileTo = function(compiler) {
  compiler.write("this")
}

Expr.Sequence.prototype.compileTo = function(compiler) {
  let topLevel = compiler.topLevel
  compiler.topLevel = false

  this.exprs.forEach((e, i) => {
    if (i !== 0) compiler.writeLine(";")
    
    let doReturn = !compiler.inline && topLevel && i == this.exprs.length - 1
    if (doReturn && !(e instanceof Expr.Var)) {
      compiler.write("return ")
    }

    e.compileTo(compiler)

    if (doReturn && e instanceof Expr.Var) {
      compiler.writeLine()
      compiler.write(`return ${convertName(e.name)}`)
    }
  })
}

Expr.Set.prototype.compileTo = function(compiler) {
  compiler.write(convertName(this.name))
  compiler.write(" = ")
  this.value.compileTo(compiler)
}

Expr.String.prototype.compileTo = function(compiler) {
  // FIXME: why are empty strings being captured this way?
  compiler.write(this.value == '""' ? this.value : JSON.stringify(this.value))
}

Expr.Var.prototype.compileTo = function(compiler) {
  if (this.name.charAt(0) != "_") {
    // TODO: should this be let?
    compiler.write("var ")
  }
  compiler.write(`${convertName(this.name)} = `)

  this.value.compileTo(compiler)
}

const convertName = function(name) {
  if (name == "nil") return "Nil"
  if (name == "true") return "True"
  if (name == "false") return "False"
  if (name.charAt(0) == "_") return "this." + convertName(name.substring(1))

  let outputName = "$";
  for (let i = 0; i < name.length; i++) {
    if (!name[i].match(/^[a-z0-9_]+$/i)) {
      outputName += "$" + name.charCodeAt(i)
    } else {
      outputName += name[i]
    }
  }

  return outputName
}

export default Compiler
