# Jay

Jay is a dynamically-typed, object-oriented, prototype-based programming language that compiles to JavaScript. It is based on the [Finch](http://finch.stuffwithstuff.com/index.html) language created by [Bob Nystrom](https://twitter.com/munificentbob), itself inspired by Smalltalk, Self, and JavaScript.

## Quick Example

```jay
Point <- class: [
  x <- 0
  y <- 0
  + other {
    Point new :: (_x <- _x + other x, _y <- _y + other y)
  }
  to-string { "({_x}, {_y})" }
]

a <- Point new :: (_x <- 3, _y <- 4)
b <- Point new :: (_x <- 1, _y <- 2)
write: a + b   // (4, 6)
```

## Running

Requires Node.js (v18+).

```sh
# Run a file
node language/main.js path/to/script.jay

# Start the REPL
node language/main.js
```

## Language Basics

Jay has no statements, only expressions. Everything is an object, and you interact with objects by sending them messages.

```jay
// Unary message
"hello" count          // 5

// Operator message
3 + 4                  // 7

// Keyword message
if: x > 0 then: { "positive" } else: { "non-positive" }

// Variables
name <- "world"        // declare with <-
name <-- "updated"     // reassign with <--

// String interpolation
write: "hello {name}"

// Blocks (closures)
double <- {|x| x * 2}
double call: 5         // 10

// Objects
counter <- [
  count <- 0
  increment { _count <- _count + 1 }
]

// Schemes (external resources)
env://HOME             // read
file:///tmp/out.txt <- "hello"  // write
```

See the [full documentation](website/pages/docs/) for more, or [try it in your browser](http://jay-lang.com/repl).

## Project Structure

```
language/         Compiler and runtime
  lexer.js        Tokenizer
  parser.js       Recursive descent parser
  ast.js          AST node types
  compile.js      Compiles AST to JavaScript
  runtime.js      Runtime object system
  print.js        AST pretty printer
  main.js         CLI entry point
  core/           Standard library (written in Jay)
  tests/          Test scripts
website/          Next.js website with browser REPL
highlighting/     VSCode syntax highlighting extension
grammar.txt       Formal grammar specification
```

## License

MIT. See [license.txt](license.txt).
