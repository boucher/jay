# Objects

When it comes to an object-oriented language, one of the most important things is, uh, objects. In Jay, everything is an object: numbers, strings, blocks of code, collections, etc. Many of these are primitive objects built into the language, but you can create your own objects too. An object contains a couple of things:

A set of methods. These are chunks of code associated with names. When you send a message to an object, invoking the method with that name is how it responds.

An internal state. Much like a local scope has variables, an object contains its own scope with named variables.

## Object Literals

You create an object by defining these things. The easiest way is with an object literal, like so:

```jay
[ greet { write-line: "Hi!" } ]
```

An object literal is a pair of square brackets. Inside the brackets are a series of definitions, separated by commas (or newlines).

In the above example, we've defined one thing: an unary method named "greet" whose body is `{ write-line: "Hi!" }`. If we store our object in a variable like this:

```jay
greeter <- [
  greet { write-line: "Hi!" }
]
```

Then we can send it a message like so:

```jay
greeter greet // "Hi!"
```

### Method Definitions

Much like unary, operator and keyword messages, object literals let you define unary, operator, and keyword methods. They look like this:

```jay
greeter <- [
  // unary
  greet { write-line: "Hi!" }

  // operator
  +++ other { write-line: "I am at " + other }

  // keyword
  greet: who and: who-else {
    write-line: "Hi, " + who + " and " + who-else
  }
]
```

When you send a message to the object, it will look for a matching method, bind the arguments to the method's parameters, and then call its block. So when you do:

```jay
greeter +++ "Fred"
```

It will bind "Fred" to other and then call the block.

### Fields

Within the body of a method, you can access and set state on the object itself. Doing so looks like working with regular variables, except their names start with an underscore *_*.

```jay
counter <- [
  increment {
    if: _count == nil then: { _count <- 0 }
    _count <- _count + 1
  }

  count { _count }
]
```

Here, the increment and count methods both use a _count field. Fields are like variables that are in scope within all methods of an object. Within a method, you can create a field simply by assigning it.

Fields are not visible outside of the object's methods. Unlike JavaScript and Self, they aren't just slots. So with the above example, you couldn't do this:

```jay
counter _count // nope
```

That's why greeter defines a count method to explicitly expose that. The idea here is that objects should encapsulate their internal state and only expose an interface to that that they control.

### Field Definitions

Often when you create an object you want it to start with some initial state. To make that easier, you can also initialize fields in an object literal. We can simplify our above example by doing:

```jay
counter <- [
  _count <- 0

  increment { _count <- _count + 1 }
  count { _count }
]
```

### Property Definitions

While it's good that objects encapsulate their state, it's also pretty common for them to expose some of it with simply unary methods that just get a field. To make that easier, you can do this:

```jay
counter <- [
  count <- 0
  increment { _count <- _count + 1 }
]
```

Here, the count `<- 0` bit is exactly equivalent to initializing _count (with the underscore!) to zero, and then defining an accessor method count that returns it.

### Self

Within the body of a method, you often want to get the object that the method is being invoked on. In Jay, that's called self:

```jay
counter <- [
  count <- 0
  increment { _count <- _count + 1 }
  increment-twice {
    self increment
    self increment
  }
]
```

Here, we're using self in order to call one method from another. Unlike Java and C++, but like JavaScript, you have to explicitly use self (or this in those languages) to send a message to yourself.

## Modifying objects

The above features are fine when you want a new object, but what if you want to mess with one you already have? For that, Jay has the bind operator: *::*. This lets you add new methods and fields to an existing object.

If we have some object fred, we can add a method to it like this:

```jay
fred :: dance { writeLine: "Sorry, I'm too sexy." }
fred dance // "Sorry, I'm too sexy."
```

This also works for operators and keyword messages:

```jay
fred :: ? right {
  writeLine: "What do I do with a " + right + "?"
}

fred :: give: gift to: who {
  writeLine: "Here, " + who + ", have a " + gift + "."
}

fred ? "plunger"
fred give: "plunger" to: "Bill"}
```

### Multibinds

It's common to want to define a number of methods on an object all at once. To make that easier, you can also use parentheses after *::* and define a group of methods, like so:

```jay
fred :: (
  dance { writeLine: "Sorry, I'm too sexy." }

  ? right { writeLine: "What do I do with a " + right + "?" }

  give: gift to: who {
    writeLine: "Here, " + who + ", have a " + gift + "."
  }
)
```

  In addition to methods, you can use bind expressions to define object variables:

### Variable Binding

```jay
fred :: (
  _name <- "Fred"
  sayName { writeLine: _name }
)
fred sayName // "Fred"
```

  If the name is an object variable name like *_name* here, it just defines that variable on the object (or assigns to it if it already exists). If you use a name without a leading underscore, then it will define an object variable with that name and automatically add an accessor method. In other words, this:

```jay
fred :: (
  band <- "Right Said Fred"
)
```

  Is exactly the same as doing:

```jay
fred :: (
  _band <- "Right Said Fred"
  band { _band }
)
```

## Inheritance

Jay is a prototype-based language. That means it doesn't have classes. When you send a message to an object, it's the object itself that we look for the methods on. But Jay does support inheritance. Every object can have a parent object.

When you send a message to an object, if it doesn't have a matching method, it delegates to its parent (which may in turn delegate to its parent, and so on, all the way up to Object, the root from which all objects ultimately descend).

You specify an object's parent by placing an expression between pipes (|) at the beginning of the literal. If you omit it, it defaults to Object.

```jay
parent <- [ inherited { "from parent" } ]
child <- [|Parent| childish { "in child" } ]

child childish // "in child"
child inherited // "in parent"
```

When an inherited method is called, self will still be the object that originally received the message, not the parent where the method was actually found. By example:

```jay
parent <- [
  say-name { write-line: self name }
  name { "parent" }
]

child <- [ name { "child" } ]
child say-name // "child"
```

Likewise, when you access fields in an inherited method, it will look for them in the original receiving object:

```jay
parent <- [
  say-name { write-line: _name }
  _name <- "parent"
]

child <- [ _name <- "child" ]
child say-name // "child"
```

In the same way that methods are inherited, fields are too. When you access a field in an object, if it can't be found there, it will look up the parent chain to find it.

When you set a field, it will always set it in the receiving object, even if it's set by an inherited method.

## Classes, Prototypes, and Types

Although Jay uses prototypal inheritance rather than standard classical inheritance, it's still common to define "kinds of things" when you write programs. Classes are a common pattern for doing that, and in Jay, they are just that: a convention that you can follow when it makes sense.

A class in other languages generally defines two things: a set of behavior that all instances of the class share, and some behavior that is specific to the class itself. In class-based languages, the former is basically your instance methods and fields. The latter is the "static" methods of the class and the constructors.

In Jay, those are two separate objects: one which we refer to as the class object, and the other which serves as an instance prototype. The prototype's job is to be the parent that all instances of this type inherit from. That way, they all share the prototype's methods and behave the same.

The class object's job is to contain the "static" methods that are relevant to the type itself but not any particular instance of it. Constructors are the most important part of this.

Jay defines a `class:` method on `Ether` that you can use to create a new class object:

```jay
Point <- class: [
  x { _x }
  y { _y }
  + other { 
    Point new :: (
      _x <- _x + other x
      _y <- _y + other y
    )
  }
]
```

The object you pass to this method is the instance prototype, and the return value is the class object. By default, it inherits from `Class`, which provides a default constructor `new` as well as a reference to the instance prototype `proto`. If you want to modify an existing class object (by adding static methods) you can bind to the class object, and if you want to modify the instance prototype for a class, you can bind to its `proto`:

```jay
Point :: (
  newX: x Y: y { 
    Point new :: (
      _x <- x
      _y <- y
    )
  }
)

Point proto :: (
  to-string { "(" + _x + ", " + _y + ")" }
)
```

Before, we created a two-dimensional point class, and here we're adding `newX:Y:` as a convenience constructor on the class object. We're also adding a `to-string` method on the instance prototype. 

You can also provide your own object to act as the instance "factory", which we refer to as the superclass, by calling `class:superclass:` and passing it as the second parameter. The built in implementation of `class:` simply calls this method with `Class` as the superclass.

It's worth noting that this is a very thin convenience layer, there's nothing special going on. If the instance prototype provided has a parent, that parent will remain the parent of any instances you create. Without adding any complexity to the language, we can define class-like things where that pattern makes sense. But, if all you need as an object, you don't have to use this at all.

> Some of these names may be a bit confusing. There's some familiarity in them, but they may be different enough that it ends up not being worth using the same name.
