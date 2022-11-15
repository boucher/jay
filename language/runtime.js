(function(){ 

  const BRIDGE = true
  globalThis.$FixBridgedTypes = function(toAssign) {
    for (let t of [$Number, $String, $Array, $Block]) {
      for (let k of Object.keys(toAssign)) {
        if (!t._proto.hasOwnProperty(k)) {
          t._proto[k] = toAssign[k]
        }
      }
    }
  }

  // this is a dumb thing...
  const VALUE = function(v) { 
    return typeof v.value === "undefined" ? v : v.value 
  }
   
  const BOOL = function(b) {
    return b ? True : False
  }

  // if we want to box values we can wrap them here...
  // NOTHING is using this right now...
  let BOX = function(klass, x) {
    // return { value: x }
    return x
  }

  globalThis.ReturnExpr = function(result, id) {
    this.result = result
    this.id = id
    //this.toString = () => "RuntimeException: cannot call return from outside of a method"
  }

  globalThis.ReturnExpr.prototype = new Error

  Object.from = function(parent, properties={}) {
    let o = Object.assign(Object.create(parent), properties)
    o._parent = parent
    return o
  }

  globalThis.$Object = {}
  globalThis.True = Object.from($Object)
  globalThis.False = Object.from($Object)
  globalThis.Nil = Object.from($Object)
  Nil.toString = function(){ "nil" }

  globalThis.$Class =  Object.from($Object, {
    "new": function() {
      return Object.from(this._proto)
    }, 

    "proto": function() {
      return this._proto
    },
  })

  globalThis.$Ether = Object.from($Object, {
    "class:superclass:": function(proto, superclass) {
      return Object.from(superclass, { _proto: proto })
    }, 
  })

  globalThis.$Number = $Ether["class:superclass:"](BRIDGE ? Number.prototype : {}, $Class)
  globalThis.$String = $Ether["class:superclass:"](BRIDGE ? String.prototype : {}, $Class)
  globalThis.$Array = $Ether["class:superclass:"](BRIDGE ? Array.prototype : {}, $Class)
  globalThis.$Block = $Ether["class:superclass:"](BRIDGE ? Function.prototype : {}, $Class)

  Object.assign($Object, {
    "===": function(other) {
      return BOOL(this === other)
    },

    "to-string": function() {
      return this.toString()
    },

    // TODO: this doesn't work
    "parent": function() {
      if (this === $Object) 
        return $Object
      else
        return this._parent
    },

    "+string:": function(s) {
      return s + this["to-string"]()
    },
  })

  Object.assign($Ether, {
    // TODO: this also writes a newline in reality
    "write:": function(text) {
      console.log(text["to-string"]())
    },

    "write-line:": function(text) {
      console.log(text["to-string"]()+"\n")
    },

    "sleep:": async function(milliseconds) {
      return new Promise((resolve, reject) => {
        setTimeout(resolve, milliseconds)
      })
    }
  })

  const BlockProto = {};
  for (let i = 1; i <= 10; i++) {
    BlockProto["call"+":".repeat(i)] = function() {
      VALUE(this).apply(VALUE(this), arguments)
    }
  }

  Object.assign($Block._proto, BlockProto)

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
      return BOOL(VALUE(this) == VALUE(x))
    },
    "!=number:": function(x) {
      return BOOL(VALUE(this) != VALUE(x))
    },
    "<number:": function(x) {
      return BOOL(VALUE(x) < VALUE(this))
    },
    ">number:": function(x) {
      return BOOL(VALUE(x) > VALUE(this))
    },
    "<=number:": function(x) {
      return BOOL(VALUE(x) <= VALUE(this))
    },
    ">=number:": function(x) {
      return BOOL(VALUE(x) >= VALUE(this))
    },
  }

  for (let k of ["floor", "ceiling", "sqrt", "sin", "cos", "tan", "asin", "acos", "atan"]) {
    NumberProto[k] = function() {
      return Math[k](VALUE(this))
    }
  }

  Object.assign($Number._proto, NumberProto)

  Object.assign($Array._proto, {
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
  
  Object.assign($String._proto, {
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
      return BOOL(s == this)
    },

    "<": function(s) {
      return BOOL(this < s)
    },

    ">": function(s) {
      return BOOL(this > s)
    },

    "<=": function(s) {
      return BOOL(this == s)
    },

    ">=": function(s) {
      return BOOL(this >= s)
    },
  })

  /*
  let Scheduler = globalThis.Scheduler = new function(){
    this.fibers = []
    this.current = null
  }

  Scheduler.switch = function(fiber, value) {
    this.current = fiber
    yield fiber(value)
  }

  globalThis.$Fibers = Object.from($Object, {
    "new-fiber": function(fn) {
      return function *() {
        fn()
      }
    },
    "current-fiber": function() {
      return Scheduler.current
    },
    "switch-to-fiber": function(value) {
      yield value
    },
  })
  */

  if (BRIDGE) {
    $FixBridgedTypes($Object)
  }

})()