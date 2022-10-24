const Expressions = {
  Array: ["elements"],
  Bind: ["receiver", "defines"],
  Block: ["params", "body"],
  Message: ["receiver", "name", "args"],
  Name: ["name"],
  Number: ["value"],
  Object: ["parent", "defines"],
  Self: [],
  Sequence: ["exprs"],
  Set: ["name", "value"],
  String: ["value"],
  Var: ["name", "value"],
  Return: ["result"],
  Error: [],
}

class Expr {}

for (let [className, fields] of Object.entries(Expressions)) {
  let klass = class extends Expr { 
    constructor(...args) { 
      super()
      fields.forEach((field, i) => {
        this[field] = args[i]
      })
    }
  }

  Object.defineProperty(klass.prototype.constructor, "name", { value: className })

  Expr[className] = klass
}

class Define {
  constructor(name, body, isMethod) {
    this.name = name
    this.body = body
    this.isMethod = isMethod
  }
}

export default Expr;
export { Define };


