export default function Objects() {
  return (<>

<p>
When it comes to an object-oriented language, one of the most important things is, uh, objects. In Jay, everything is an object: numbers, strings, blocks of code, collections, etc. Many of these are primitive objects built into the language, but you can create your own objects too. An object contains a couple of things:
</p>

<p>
A set of methods. These are chunks of code associated with names. When you send a message to an object, invoking the method with that name is how it responds.
</p>

<p>
An internal state. Much like a local scope has variables, an object contains its own scope with named variables.
</p>

<h2>Object Literals</h2>

<p>
You create an object by defining these things. The easiest way is with an object literal, like so:
</p>

<pre><code>
{`[ greet { write-line: "Hi!" } ]`}
</code></pre>

<p>
An object literal is a pair of square brackets. Inside the brackets are a series of definitions, separated by commas (or newlines).
</p>

<p>
In the above example, we've defined one thing: an unary method named "greet" whose body is <code>{`{ write-line: "Hi!" }`}</code>. If we store our object in a variable like this:
</p>

<pre><code>
{`greeter <- [
  greet { write-line: "Hi!" }
]`}
</code></pre>

<p>
Then we can send it a message like so:
</p>

<pre><code>
{`greeter greet // "Hi!"`}
</code></pre>

<h3>Method Definitions</h3>

<p>
Much like unary, operator and keyword messages, object literals let you define unary, operator, and keyword methods. They look like this:
</p>

<pre><code>
{`greeter <- [
  // unary
  greet { write-line: "Hi!" }

  // operator
  +++ other { write-line: "I am at " + other }

  // keyword
  greet: who and: who-else {
    write-line: "Hi, " + who " and " + who-else
  }
]`}
</code></pre>

<p>
When you send a message to the object, it will look for a matching method, bind the arguments to the method's parameters, and then call its block. So when you do:
</p>

<pre><code>
{`greeter +++ "Fred"`}
</code></pre>

<p>
It will bind "Fred" to other and then call the block.
</p>

<h3>Fields</h3>

<p>
Within the body of a method, you can access and set state on the object itself. Doing so looks like working with regular variables, except their names start with an underscore <code>_</code>.
</p>

<pre><code>
{`counter <- [
  increment {
    if: _count == nil then: { _count <- 0 }
    _count <- _count + 1
  }

  count { _count }
]`}</code></pre>

<p>
Here, the increment and count methods both use a _count field. Fields are like variables that are in scope within all methods of an object. Within a method, you can create a field simply by assigning it.
</p>

<p>
Fields are not visible outside of the object's methods. Unlike JavaScript and Self, they aren't just slots. So with the above example, you couldn't do this:
</p>

<pre><code>
{`counter _count // nope`}
</code></pre>

<p>
That's why greeter defines a count method to explicitly expose that. The idea here is that objects should encapsulate their internal state and only expose an interface to that that they control.
</p>

<h3>Field Definitions</h3>

<p>
Often when you create an object you want it to start with some initial state. To make that easier, you can also initialize fields in an object literal. We can simplify our above example by doing:
</p>

<pre><code>
{`counter <- [
  _count <- 0

  increment { _count <- _count + 1 }
  count { _count }
]`}</code></pre>

<h3>Property Definitions</h3>

<p>
While it's good that objects encapsulate their state, it's also pretty common for them to expose some of it with simply unary methods that just get a field. To make that easier, you can do this:
</p>

<pre><code>
{`counter <- [
  count <- 0
  increment { _count <- _count + 1 }
]`}</code></pre>

<p>
Here, the count {`<- 0`} bit is exactly equivalent to initializing _count (with the underscore!) to zero, and then defining an accessor method count that returns it.
</p>

<h3>Self</h3>

<p>
Within the body of a method, you often want to get the object that the method is being invoked on. In Jay, that's called self:
</p>

<pre><code>
{`counter <- [
  count <- 0
  increment { _count <- _count + 1 }
  increment-twice {
    self increment
    self increment
  }
]`}</code></pre>

<p>
Here, we're using self in order to call one method from another. Unlike Java and C++, but like JavaScript, you have to explicitly use self (or this in those languages) to send a message to yourself.
</p>

<h2>Modifying objects</h2>

<p>
The above features are fine when you want a new object, but what if you want to mess with one you already have? For that, Jay has the bind operator: <code>::</code>. This lets you add new methods and fields to an existing object.
</p>

<p>
If we have some object fred, we can add a method to it like this:
</p>

<pre><code>
{`fred :: dance { writeLine: "Sorry, I'm too sexy." }
fred dance // "Sorry, I'm too sexy."`}
</code></pre>

<p>
This also works for operators and keyword messages:
</p>

<pre><code>
{`fred :: ? right {
  writeLine: "What do I do with a " + right + "?"
}

fred :: give: gift to: who {
  writeLine: "Here, " + who + ", have a " + gift + "."
}

fred ? "plunger"
fred give: "plunger" to: "Bill"}`}
</code></pre>


<h3>Multibinds</h3>

<p>
It's common to want to define a number of methods on an object all at once. To make that easier, you can also use parentheses after <code>::</code> and define a group of methods, like so:
</p>

<pre><code>
{`fred :: (
  dance { writeLine: "Sorry, I'm too sexy." }

  ? right { writeLine: "What do I do with a " + right + "?" }

  give: gift to: who {
    writeLine: "Here, " + who + ", have a " + gift + "."
  }
)`}
</code></pre>

<p>
  In addition to methods, you can use bind expressions to define object variables:
</p>

<h3>Variable Binding</h3>

<pre><code>
{`fred :: (
  _name <- "Fred"
  sayName { writeLine: _name }
)
fred sayName // "Fred"`}
</code></pre>

<p>
  If the name is an object variable name like <code>_name</code> here, it just defines that variable on the object (or assigns to it if it already exists). If you use a name without a leading underscore, then it will define an object variable with that name and automatically add an accessor method. In other words, this:
</p>

<pre><code>
{`fred :: (
  band <- "Right Said Fred"
)`}
</code></pre>

<p>
  Is exactly the same as doing:
</p>

<pre><code>
{`fred :: (
  _band <- "Right Said Fred"
  band { _band }
)`}
</code></pre>

<h2>Inheritance</h2>

<p>
Jay is a prototype-based language. That means it doesn't have classes. When you send a message to an object, it's the object itself that we look for the methods on. But Jay does support inheritance. Every object can have a parent object.
</p>

<p>
When you send a message to an object, if it doesn't have a matching method, it delegates to its parent (which may in turn delegate to its parent, and so on, all the way up to Object, the root from which all objects ultimately descend).
</p>

<p>
You specify an object's parent by placing an expression between pipes (|) at the beginning of the literal. If you omit it, it defaults to Object.
</p>

<pre><code>
{`parent <- [ inherited { "from parent" } ]
child <- [|Parent| childish { "in child" } ]

child childish // "in child"
child inherited // "in parent"`}
</code></pre>

<p>
When an inherited method is called, self will still be the object that originally received the message, not the parent where the method was actually found. By example:
</p>


<pre><code>
{`parent <- [
  say-name { write-line: self name }
  name { "parent" }
]

child <- [ name { "child" } ]
child say-name // "child"`}
</code></pre>

<p>
Likewise, when you access fields in an inherited method, it will look for them in the original receiving object:
</p>

<pre><code>
{`parent <- [
  say-name { write-line: _name }
  _name <- "parent"
]

child <- [ _name <- "child" ]
child say-name // "child"`}
</code></pre>

<p>
In the same way that methods are inherited, fields are too. When you access a field in an object, if it can't be found there, it will look up the parent chain to find it.
</p>

<p>
When you set a field, it will always set it in the receiving object, even if it's set by an inherited method.
</p>

<h2>Prototypes and Type Objects</h2>

<p>
Jay doesn't have classes, but it's still common to define "kinds of things" when you write programs. Classes are a common pattern for doing that. In Jay, they are just that: a convention that you can follow when it makes sense.
</p>

<p>
A class in other languages generally defines two things: a set of behavior that all instances of the class share, and some behavior that is specific to the class itself. In class-based languages, the former is basically your instance methods and fields. The latter is the "static" methods of the class and the constructors.
</p>

<p>
In Jay, we define those as two separate objects. We call the former the "prototype" and the latter the "type object". The prototype's job is to be the parent that all instances of this type inherit from. That way, they all share the prototype's methods and behave the same.
</p>

<p>
The type object's job is to contain the "static" methods that are relevant to the type itself but not any particular instance of it. Constructors are the most important part of this.
</p>

<p>
The convention in Jay is that the type object is named using a singular PascalCased noun, and the prototype is plural.
</p>

<pre><code>
{`Point <- [
  new-x: x y: y { [|Points| _x <- x, _y <- y ] }
]

Points <- [
  x { _x }
  y { _y }
  + other { Point new-x: _x + other x y: _y + other y }
  toString { "(" + _x + ", " + _y + ")" }
]`}
</code></pre>

<p>
Here we're defining a two-dimensional point type. The Point object represents the type itself. It's one contribution is to define a constructor method that creates a new point instance. That method just returns an object literal with some state initialized and its parent correctly wired up to Points.
</p>

<p>
Points, in turn, is the prototype. It has the methods that all points support. Here it's just accessors for the coordinates, a little + operator so you can do vector math, and a to-string method so it can display itself. We can use these like so:
</p>

<pre><code>
{`a <- Point new-x: 2 y: 3
b <- Point new-x: 1 y: 4
write-line: a + b // (3, 7)`}
</code></pre>

<p>
So, without adding any complexity to the language, we can define class-like things where that pattern makes sense. But, if all you need as an object, you don't have to deal with that baggage.
</p>

<p className="todo">
  I think we may be able to add something on Ether to make this a bit nicer, e.g.:
</p>

<pre><code>
{`Point <- class: [
  x { _x }
  y { _y }

] static: [
  new-x: x y: y { |Point new| _x <- x, _y <- y }
]`}</code></pre>

  </>)
}