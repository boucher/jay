import Expr, { Define } from "./ast.js"


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

let compilerID = 1;
class Compiler {
  constructor(inline=false) {
    this._indent = ""
    this.buffer = []
    this.inline = inline
    this.topLevel = true
    this.parent = null
    this.id = compilerID++
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
    for (let item of this.buffer) {
      result += item
    }
    return result
  }

  write(s) {
    this.buffer.push(s)
  }

  writeLine(s="") {
    this.buffer.push(s + "\n" + this._indent)
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

function wrapReturn(expr, compiler) {
  if (expr instanceof Expr.Var) {
    // if it's a var expression, we return the name of the var we assigned
    expr.compileTo(compiler)
    compiler.writeLine("")
    compiler.write(`return ${convertName(expr.name)}`)
  } else {
    // otherwise, we wrap the expression in a return statement and parens
    compiler.write("return (")
    expr.compileTo(compiler)
    compiler.write(")")
  }
}

Expr.Block.prototype.compileTo = function(compiler, methodDefinition=false) {
  if (!methodDefinition) {
    compiler.write("((")
  } else {
    compiler.write("(function(")
  }

  this.params.forEach((p, i) =>  {
    if (i != 0) compiler.write(", ")
    compiler.write(convertName(p))
  })

  if (!methodDefinition) {
    compiler.write(") => {")
  } else {
    compiler.write(") {")
  }

  compiler.indent()
  compiler.writeLine("")

  if (methodDefinition) {
    compiler.write("try {")
    compiler.indent()
    compiler.writeLine("")  
  }

  if (this.body instanceof Expr.Sequence) {
    let length = this.body.exprs.length
    let existing = this.body.exprs[length - 1]
    this.body.exprs[length - 1] = {
      compileTo: (compiler) => {
        wrapReturn(existing, compiler)
      }
    }

    this.body.compileTo(compiler)
  } else {
    wrapReturn(this.body, compiler)
  }
  

  if (methodDefinition) {
    compiler.dedent()
    compiler.writeLine("")
    compiler.writeLine("} catch(e) {")
    compiler.writeLine(`  if (e instanceof ReturnExpr && e.id == ${compiler.id}) { return e.result } else { throw e }`)
    compiler.writeLine("}")
  }

  compiler.dedent()
  compiler.writeLine("")
  compiler.write("})")
}

Expr.Return.prototype.compileTo = function(compiler) {
  compiler.write("(()=>{throw new ReturnExpr(")
  this.result.compileTo(compiler)
  compiler.write(`, ${compiler.id}`)
  compiler.write(")})()")
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
    this.body.compileTo(compiler, false)
  } else {
    let methodCompiler = new Compiler()
    methodCompiler.parent = this
    methodCompiler.topLevel = false
    methodCompiler._indent = compiler._indent
  
    compiler.write(`"${this.name}": `)
    this.body.compileTo(methodCompiler, true)
    compiler.buffer = compiler.buffer.concat(methodCompiler.buffer)
  }
  
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
    if (doReturn) {
      wrapReturn(e, compiler)
    } else {
      e.compileTo(compiler)
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

export default Compiler
