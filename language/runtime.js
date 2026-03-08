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

  const BOOL = function(b) {
    return b ? True : False
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

  /*
  let proxyHandler = {
    get(target, prop, receiver) {
      const value = Reflect.get(...arguments);
      return typeof value === "undefined" ? 
          createProxy(prop, receiver) :
          value
    }
  }

  function createProxy(msg, receiver) {
    return function(...args) {
        return receiver["forward::"](msg, args)
    }
  }
  
  let RootObject = {}
  globalThis.$Object = new Proxy(RootObject, proxyHandler);
  */

  globalThis.$Object = {};

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

  globalThis.$Module = $Ether["class:superclass:"](Object.from($Object, {
    exports: function() { return this.$exports },
    $exports: {},

    "import:": async function(path) {
      let resolved = this.$dirname + "/" + path
      let source = $Runtime.readFile(resolved)
      if (source == null) return Nil
      let mod = await eval?.($compile(source, path))
      return mod.$exports || Nil
    }
  }), $Class)


  globalThis.$Schemes = {
    "env": {
      read: function(path) {
        if (typeof process !== 'undefined') {
          let val = process.env[path]
          return val !== undefined ? val : Nil
        }
        return Nil
      },
      create: function(path, value) {
        if (typeof process !== 'undefined') {
          process.env[path] = value["to-string"]()
        }
        return value
      },
      update: function(path, value) {
        if (typeof process !== 'undefined') {
          if (process.env[path] === undefined) return Nil
          process.env[path] = value["to-string"]()
        }
        return value
      }
    }
  }

  Object.assign($Object, {
    "===": function(other) {
      let a = typeof this === 'object' ? this.valueOf() : this
      let b = typeof other === 'object' ? other.valueOf() : other
      return BOOL(a === b)
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

    "print:": function(text) {
      this["write-line"](text)
    },

    "sleep:": async function(milliseconds) {
      return new Promise((resolve, reject) => {
        setTimeout(resolve, milliseconds)
      })
    },

    "register-scheme:handler:": function(name, handler) {
      $Schemes[name["to-string"]()] = {
        read: function(path) { return handler["read:"](path) },
        create: function(path, value) { return handler["create:value:"](path, value) },
        update: function(path, value) { return handler["update:value:"](path, value) }
      }
    },
  })

  const BlockProto = {
    "apply:": function(args) {
      return this.apply(this, args)
    }
  };

  // TODO it would probably be much more performant to not go through apply
  for (let i = 1; i <= 10; i++) {
    BlockProto["call"+":".repeat(i)] = function(...args) {
      return this.apply(this, args)
    }
  }

  Object.assign($Block._proto, BlockProto)

  let NumberProto = {
    "abs": function() {
      return Math.abs(this)
    },

    "neg": function() {
      return -this
    },

    "mod:": function(i) {
      return this % i
    },
    "+number:": function(x) {
      return x + this
    },
    "-number:": function(x) {
      return x - this
    },
    "*number:": function(x) {
      return x * this
    },
    "/number:": function(x) {
      return x / this
    },
    "=number:": function(x) {
      return BOOL(+this === +x)
    },
    "!=number:": function(x) {
      return BOOL(+this !== +x)
    },
    "<number:": function(x) {
      return BOOL(+x < +this)
    },
    ">number:": function(x) {
      return BOOL(+x > +this)
    },
    "<=number:": function(x) {
      return BOOL(+x <= +this)
    },
    ">=number:": function(x) {
      return BOOL(+x >= +this)
    },
  }

  for (let k of ["floor", "ceiling", "sqrt", "sin", "cos", "tan", "asin", "acos", "atan"]) {
    NumberProto[k] = function() {
      return Math[k](this)
    }
  }

  Object.assign($Number._proto, NumberProto)

  Object.assign($Array._proto, {
    "count": function() {
      return this.length
    },

    "add:": function(x) {
      return this.push(x)
    },

    "at:": function(i) {
      return this[i]
    },

    "at:put:": function(i, x) {
      this[i] = x
    },

    "removeAt:": function(i) {
      return this.splice(i, 1)
    }
  })
  
  Object.assign($String._proto, {
    "count": function() {
      return this.length
    },

    "at:": function(i) {
      return this[i]
    },

    "from:count:": function(start, count) {
      return this.substring(start, start + count)
    },
    
    "index-of:": function(s) {
      return this.indexOf(s)
    },

    "=string:": function(s) {
      return BOOL(`${s}` === `${this}`)
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