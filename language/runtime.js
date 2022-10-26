(function(){ 

  const BRIDGE = true

  globalThis.True = {}
  globalThis.False = {}
  globalThis.Nil = null

  globalThis.$Object = {}
  globalThis.$Ether = Object.create($Object)
  //globalThis.$Fibers = Object.create($Object)

  if (BRIDGE) {
    globalThis.$Numbers = Number.prototype
    globalThis.$Strings = String.prototype
    globalThis.$Arrays = Array.prototype
    globalThis.$Blocks = Function.prototype
  } else {
    globalThis.$Numbers = Object.create($Object)
    globalThis.$Strings = Object.create($Object)
    globalThis.$Arrays = Object.create($Object)
    globalThis.$Blocks = Object.create($Object)
  }

  // this is a dumb thing...
  const VALUE = function(v) { 
    return typeof v.value === "undefined" ? v : v.value 
  }
   
  // if we want to box values we can wrap them here...
  // NOTHING is using this right now...
  let BOX = function(klass, x) {
    // return { value: x }
    return x
  }

  Object.assign($Object, {
    "===": function(other) {
      return this === other ? True : False
    },

    "to-string": function() {
      return this.toString()
    },

    "parent": function() {
      if (this === $Object) 
        return $Object
      else
        return this.prototype
    },

    "+string:": function(s) {
      return s + this["to-string"]()
    },

  })

  Object.assign($Ether, {

  })

  const BlockProto = {};
  for (let i = 1; i <= 10; i++) {
    BlockProto["call"+":".repeat(i)] = function() {
      VALUE(this).apply(VALUE(this), arguments)
    }
  }

  Object.assign($Blocks, BlockProto)

  let NumberProto = {
    "abs": function() {
      return Math.abs(VALUE(this))
    },

    "neg": function() {
      return -VALUE(this)
    },

    "mod:": function(i) {
      return VALUE(this) % VALUE(i)
    },
    "+number:": function(x) {
      return VALUE(x) + VALUE(this)
    },
    "-number:": function(x) {
      return VALUE(x) - VALUE(this)
    },
    "*number:": function(x) {
      return VALUE(x) * VALUE(this)
    },
    "/number:": function(x) {
      return VALUE(x) / VALUE(this)
    },
    "=number:": function(x) {
      return VALUE(this) == VALUE(x)
    },
    "!=number:": function(x) {
      return VALUE(this) != VALUE(x)
    },
    "<number:": function(x) {
      return VALUE(x) < VALUE(this)
    },
    ">number:": function(x) {
      return VALUE(x) > VALUE(this)
    },
    "<=number:": function(x) {
      return VALUE(x) <= VALUE(this)
    },
    ">=number:": function(x) {
      return VALUE(x) >= VALUE(this)
    },
  }

  for (let k of ["floor", "ceiling", "sqrt", "sin", "cos", "tan", "asin", "acos", "atan"]) {
    NumberProto[k] = function() {
      return Math[k](VALUE(this))
    }
  }

  Object.assign($Numbers, NumberProto)

  Object.assign($Arrays, {
    "count": function() {
      return VALUE(this).length
    },

    "add:": function(x) {
      return VALUE(this).push(x)
    },

    "at:": function(i) {
      return VALUE(this)[i]
    },

    "at:put:": function(i, x) {
      VALUE(this)[i] = x
    },

    "removeAt:": function(i) {
      return VALUE(this).splice(i, 1)
    }
  })
  
  Object.assign($Strings, {
    "count": function() {
      return VALUE(this).length
    },

    "at:": function(i) {
      return VALUE(this)[i]
    },

    "from:count:": function(start, count) {
      return VALUE(this).substring(start, count)
    },
    
    "index-of:": function(s) {
      return VALUE(this).indexOf(s)
    },

    "=string:": function(s) {
      return s == this
    },

    "<": function(s) {
      return this < s
    },

    ">": function(s) {
      return this > s
    },

    "<=": function(s) {
      return this == s
    },

    ">=": function(s) {
      return this >= s
    },

    // TODO: this also writes a newline in reality
    "write:": function(text) {
      console.log(text["to-string"]())
    },

    "writeLine:": function() {
      console.log(text["to-string"]()+"\n")
    },
  })

  if (BRIDGE) {
    Object.assign($Numbers, $Object)
    Object.assign($Arrays, $Object)
    Object.assign($Blocks, $Object)
    Object.assign($Strings, $Object)
  }

})()