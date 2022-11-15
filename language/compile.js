import Expr, { Define } from "./ast.js"


function convertName(name) {
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

function enclosingMethodCompiler(compiler) {
  let c = compiler
  while (c != null && !c.method) {
    c = c.parent
  }
  return c
}
 
let compilerID = 1;
class Compiler {
  constructor() {
    this._indent = ""
    this.buffer = []
    this.methodVars = []
    this.id = compilerID++
    this.parent = null
    this.method = false
  }

  childCompiler(method) {
    let c = new Compiler()
    c._indent = this._indent
    c.parent = this
    c.method = method
    return c
  }

  static compile(expression, inline=false) {
    let compiler =new Compiler()

    if (!inline) {
      compiler.write("(async function(){")
      compiler.indent()
      compiler.writeLine()
      wrapReturn(expression, compiler)
      compiler.dedent()
      compiler.writeLine("")
      compiler.writeLine("})()")
    } else {
      expression.compileTo(compiler)
    }

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
  compiler.indent()
  compiler.writeLine("(() => {")

  compiler.write("let r = (")
  this.receiver.compileTo(compiler)
  compiler.writeLine(")")

  compiler.indent()
  compiler.writeLine("let p = {")

  this.defines.forEach((d, i) => {
    d.compileTo(compiler)
  })

  compiler.dedent()
  compiler.writeLine("")
  compiler.writeLine("}")

  compiler.writeLine("Object.assign(r, p)")

  compiler.writeLine("if (r == $Object) { $FixBridgedTypes(p) }")

  compiler.dedent()
  compiler.writeLine("return r")
  compiler.write("})()")
}

function wrapReturn(expr, compiler) {
  if (expr instanceof Expr.Sequence) {
    let length = expr.exprs.length
    let existing = expr.exprs[length - 1]
    expr.exprs[length - 1] = {
      compileTo: (compiler) => {
        wrapReturn(existing, compiler)
      }
    }
    expr.compileTo(compiler)
  } else if (expr instanceof Expr.Var) {
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
  compiler.write("(")
  if (this.async) {
    compiler.write("async ")
  }

  if (!methodDefinition) {
    compiler.write("(")
  } else {
    compiler.write("function(")
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
  
  let blockCompiler = compiler.childCompiler(methodDefinition)
  
  wrapReturn(this.body, blockCompiler)
  
  // write out the top level var declarations
  if (blockCompiler.methodVars.length > 0) {
    compiler.write("var ")
    blockCompiler.methodVars.forEach((v, i) => {
      if (i != 0) compiler.write(", ")
      compiler.write(convertName(v))
    })
    compiler.writeLine(";")
  }

  // add in the compiled block body
  if (blockCompiler.buffer.length) {
    compiler.buffer = compiler.buffer.concat(blockCompiler.buffer)
  }
  
  if (methodDefinition) {      
    compiler.dedent()
    compiler.writeLine("")
    compiler.writeLine("} catch(e) {")
    compiler.writeLine(`  if (e instanceof ReturnExpr && e.id == ${blockCompiler.id}) { return e.result } else { throw e }`)
    compiler.write("}")
  }

  compiler.dedent()
  compiler.writeLine("")
  compiler.write("})")
}

Expr.Return.prototype.compileTo = function(compiler) {
  compiler.write("(()=>{throw new ReturnExpr(")
  this.result.compileTo(compiler)
  compiler.write(`, ${enclosingMethodCompiler(compiler).id}`)
  compiler.write(")})()")
}

Expr.Await.prototype.compileTo = function(compiler) {
  compiler.write("await (")
  this.promise.compileTo(compiler)
  compiler.write(")")
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
    
    compiler.write(`"${convertName(this.name.substring(1))}": `)
    this.body.compileTo(compiler, false)
  } else {
    compiler.write(`"${this.name}": `)
    this.body.compileTo(compiler, true)
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

  compiler.write("Object.from(")
  if (this.parent) {
    this.parent.compileTo(compiler)
  } else {
    compiler.writeLine("$Object")
  }
  compiler.writeLine(", {")

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
  this.exprs.forEach((e, i) => {
    if (i !== 0) compiler.writeLine(";")
    e.compileTo(compiler)
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
      compiler.methodVars.push(this.name)
  }

  compiler.write(`${convertName(this.name)} = `)

  this.value.compileTo(compiler)
}

export default Compiler
