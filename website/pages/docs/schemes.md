# Schemes

Jay's scheme system is inspired by the concept of *Polymorphic Identifiers*, introduced by Marcel Weiher and Robert Hirschfeld in their paper [Polymorphic Identifiers: Uniform Resource Access in Objective-Smalltalk](https://www.hirschfeld.org/writings/media/WeiherHirschfeld_2013_PolymorphicIdentifiersUniformResourceAccessInObjectiveSmalltalk_AcmDL.pdf) (DLS 2013). The core insight of that work is that identifiers in a programming language can be generalized to name not just local variables, but any kind of resource &mdash; files, environment variables, web pages, database rows, hardware pins &mdash; using a uniform syntax based on URI schemes.

In object-oriented programming, polymorphic dispatch lets you swap implementations without changing client code. Polymorphic identifiers extend this same idea to *storage*. A scheme like `env://HOME` or `file:///tmp/data.txt` is not just a string &mdash; it's a first-class expression that the language knows how to read, write, and update. The scheme handler determines what those operations mean for each resource type. Client code stays the same regardless of whether the underlying resource is an environment variable, a file, an HTTP endpoint, or something you define yourself.

Jay implements this idea with a URI-like syntax:

```jay
scheme://path
```

Where `scheme` names a registered scheme handler and `path` identifies a specific resource within that scheme. Reading is just using the identifier as an expression. Writing uses the same assignment arrows as variables:

```jay
// Read
value <- env://HOME

// Create (like declaring a new resource)
file:///tmp/greeting.txt <- "hello"

// Update (like reassigning an existing resource)
env://MY_VAR <-- "new value"
```

The distinction between `<-` (create) and `<--` (update) mirrors Jay's variable assignment: `<-` declares, `<--` reassigns. For schemes, this lets handlers distinguish between creating a new resource and modifying an existing one. The `env` scheme, for example, will silently ignore an update to a variable that doesn't exist.

## Path Interpolation

Scheme paths support the same `{}` interpolation as strings:

```jay
key <- "HOME"
write: env://{key}

table <- "users"
id <- 42
// could use a hypothetical database scheme:
// row <- db://{table}/{id}
```

This lets you construct resource paths dynamically while keeping the scheme syntax readable.

## Built-in Schemes

### `env` &mdash; Environment Variables

The `env` scheme reads and writes process environment variables. It is always available.

```jay
// Read an environment variable
home <- env://HOME
write: home

// Set a new environment variable
env://MY_APP_MODE <- "production"
write: env://MY_APP_MODE

// Update an existing one
env://MY_APP_MODE <-- "development"

// Reading a variable that doesn't exist returns nil
write: env://DOES_NOT_EXIST   // nil
```

### `file` &mdash; File System

The `file` scheme reads and writes files as text. It is available when running on Node.js.

```jay
// Write a file
file:///tmp/hello.txt <- "Hello, world!"

// Read it back
write: file:///tmp/hello.txt   // Hello, world!

// Update only works if the file already exists
file:///tmp/hello.txt <-- "Updated content"

// Reading a nonexistent file returns nil
write: file:///tmp/nope.txt   // nil
```

### `http` / `https` &mdash; Web Resources

The `http` and `https` schemes fetch resources from the web using HTTP. Because network requests are asynchronous, you need `await`:

```jay
// Fetch a web page
html <- await https://example.com
write: html

// POST data to an endpoint
response <- await https://api.example.com/data <- "some payload"
```

Reading performs a GET request, creating (`<-`) performs a POST, and updating (`<--`) performs a PUT. If the request fails, `nil` is returned.

## Custom Schemes

You can define your own schemes entirely in Jay using `register-scheme:handler:`. A scheme handler is any object that responds to `read:`, `create:value:`, and `update:value:`:

```jay
// A simple key-value store scheme
store <- [
  _keys <- #[]
  _vals <- #[]

  read: key {
    from: 0 to: _keys count - 1 do: {|i|
      if: (_keys at: i) = key then: { return _vals at: i }
    }
    nil
  }

  create: key value: value {
    _keys add: key
    _vals add: value
    value
  }

  update: key value: value {
    from: 0 to: _keys count - 1 do: {|i|
      if: (_keys at: i) = key then: {
        _vals at: i put: value
        return value
      }
    }
    nil
  }
]

register-scheme: "memo" handler: store
```

Now you can use `memo://` just like any built-in scheme:

```jay
memo://greeting <- "hello"
memo://name <- "world"

write: memo://greeting          // hello
write: memo://name              // world

memo://greeting <-- "hi"
write: memo://greeting          // hi

// Interpolation works too
key <- "name"
write: memo://{key}             // world
```

### Use Cases

Because scheme handlers are just objects, they can wrap anything:

- **Configuration stores**: read from and write to application config
- **Caches**: a scheme that checks a cache before hitting a slower resource
- **Logging**: a write-only scheme that records operations
- **Databases**: map paths to queries or key lookups
- **Hardware**: as Weiher demonstrated, even GPIO pins can be controlled through schemes &mdash; `gpio://17 <- 1`

The power of the approach is that all these different resources share the same syntax. Code that reads `scheme://path` doesn't need to know or care what kind of resource is behind the scheme. You can swap implementations, add caching layers, or redirect to entirely different backends without changing the code that uses them.

## How It Works

Under the hood, a scheme expression like `env://HOME` compiles to:

```js
$Schemes["env"].read("HOME")
```

And an assignment like `env://KEY <- "value"` compiles to:

```js
$Schemes["env"].create("KEY", "value")
```

Interpolated paths compile as string concatenation, just like interpolated strings. So `env://{key}` becomes:

```js
$Schemes["env"].read((key)["to-string"]())
```

Scheme handlers registered from Jay via `register-scheme:handler:` are wrapped to bridge between the JavaScript runtime and Jay's message-passing interface.
