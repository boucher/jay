# Standard Library Reference

This is a reference for all built-in methods available in Jay, organized by type. Methods defined in Jay's core library (core.jay) are marked with *core*. Methods implemented natively in JavaScript are marked with *native*.

## Object

All objects inherit from Object. These methods are available on every value.

| Method | Description |
|--------|-------------|
| `= right` | Equality. Defaults to reference equality; overridden by Number and String. *core* |
| `!= right` | Inequality. *core* |
| `=== right` | Strict reference equality. *native* |
| `&& right` | Logical AND (non-short-circuit). *core* |
| `not` | Returns `true` (non-true objects are falsy). *core* |
| `to-string` | String representation. *native* |
| `yourself` | Returns self. *core* |
| `isa: class` | Returns `true` if this object is an instance of the given class. *core* |
| `true?` | Returns `false`. Only `true` and truthy blocks return `true`. *core* |
| `and: right` | Short-circuiting logical AND. *core* |
| `or: right` | Short-circuiting logical OR. *core* |
| `switch` | Returns a Switches object for pattern matching. See below. *core* |
| `call` | On a non-block, returns self. *core* |
| `forward: message : arguments` | Called when an object receives a message it doesn't understand. Override to implement delegation, proxies, or custom dispatch. Default returns nil. *core* |

### Type Tests

Every object responds to these with `false`; the corresponding type overrides it to return `true`.

| Method | True for |
|--------|----------|
| `number?` | Numbers |
| `string?` | Strings |
| `array?` | Arrays |
| `block?` | Blocks |
| `boolean?` | `true` and `false` |

## Number

Numbers are double-precision floating point values bridged to JavaScript numbers.

### Arithmetic

All arithmetic operators use double-dispatch, so they work correctly with mixed types.

| Method | Description |
|--------|-------------|
| `+ right` | Addition. *core* |
| `- right` | Subtraction. *core* |
| `* right` | Multiplication. *core* |
| `/ right` | Division. *core* |
| `mod: n` | Modulo (remainder). *native* |
| `neg` | Negation (unary minus). *native* |
| `abs` | Absolute value. *native* |

### Comparison

| Method | Description |
|--------|-------------|
| `= right` | Equality. *core* + *native* |
| `!= right` | Inequality. *core* + *native* |
| `< right` | Less than. *core* + *native* |
| `> right` | Greater than. *core* + *native* |
| `<= right` | Less than or equal. *core* + *native* |
| `>= right` | Greater than or equal. *core* + *native* |

### Math

| Method | Description |
|--------|-------------|
| `floor` | Round down to integer. *native* |
| `ceiling` | Round up to integer. *native* |
| `sqrt` | Square root. *native* |
| `sin` | Sine (radians). *native* |
| `cos` | Cosine (radians). *native* |
| `tan` | Tangent (radians). *native* |
| `asin` | Arc sine. *native* |
| `acos` | Arc cosine. *native* |
| `atan` | Arc tangent. *native* |

## String

Strings are text values bridged to JavaScript strings. They support interpolation with `{}` in literals.

| Method | Description |
|--------|-------------|
| `count` | Number of characters. *native* |
| `at: i` | Character at index (zero-based). *native* |
| `+ right` | Concatenation (double-dispatch). *core* |
| `= right` | String equality (double-dispatch). *core* + *native* |
| `< right` | Lexicographic less than. *native* |
| `> right` | Lexicographic greater than. *native* |
| `index-of: s` | Index of substring, or -1. *native* |
| `contains: s` | Whether the string contains a substring. *core* |
| `starts-with: s` | Whether the string starts with a prefix. *core* |
| `from: start` | Substring from index to end. *core* |
| `from: start to: end` | Substring from start up to (not including) end. *core* |
| `from: start count: n` | Substring of n characters starting at index. *native* |

## Array

Arrays are resizable, ordered collections bridged to JavaScript arrays. Create them with `#[...]` syntax.

| Method | Description |
|--------|-------------|
| `count` | Number of elements. *native* |
| `at: i` | Element at index (zero-based). *native* |
| `at: i put: value` | Set element at index. *native* |
| `add: value` | Append an element. *native* |
| `removeAt: i` | Remove element at index. *native* |
| `++ right` | Concatenate two arrays into a new one. *core* |
| `each: block` | Call block with each element. *core* |
| `each: block between: separator` | Call block with each element, calling separator between. *core* |
| `map: block` | Return new array with block applied to each element. *core* |
| `select: block` | Return new array with elements for which block returns true. *core* |
| `reject: block` | Return new array with elements for which block returns false. *core* |
| `reduce: initial with: block` | Accumulate a value by calling block with accumulator and each element. *core* |

### Higher Order Messaging (HOM)

These unary methods return a proxy that captures the *next* message and applies it to each element. They work with single unary or binary messages.

| Method | Description |
|--------|-------------|
| `map` | Transform each element: `nums map neg`, `nums map * 2` *native* |
| `each` | Send a message to each element, return self: `items each write-line` *native* |
| `select` | Keep elements where message returns true: `nums select > 3` *native* |
| `reject` | Remove elements where message returns true: `nums reject > 3` *native* |
| `reduce` | Accumulate with a binary message: `nums reduce + 0` *native* |

```jay
// HOM examples
#[1, 2, 3] map * 10          //=> #[10, 20, 30]
#[1, 2, 3] map neg            //=> #[-1, -2, -3]
#[1, 2, 3, 4] select > 2      //=> #[3, 4]
#[1, 2, 3, 4] reduce + 0      //=> 10
people map name                //=> #["Alice", "Bob", "Carol"]
```

### Array Creation

| Method | Description |
|--------|-------------|
| `Array count: n` | Create array of n elements filled with nil. *core* |
| `Array count: n fill-with: value` | Create array of n elements filled with value. *core* |

## Block

Blocks are closures created with `{ }` syntax. They are bridged to JavaScript functions.

| Method | Description |
|--------|-------------|
| `call` | Invoke with no arguments. *core* |
| `call: a` | Invoke with one argument. *native* |
| `call: a : b` | Invoke with two arguments (up to 10). *native* |
| `apply: args` | Invoke with an array of arguments. *native* |
| `true?` | Calls the block and returns whether the result is truthy. *core* |

Async blocks are created with `@{ }` and return promises.

## Ether (Global Functions)

Messages sent without a receiver go to `Ether`. These are Jay's "global functions."

### I/O

| Method | Description |
|--------|-------------|
| `write: text` | Print text (with newline). *native* |
| `write-line: text` | Print text (with newline). *native* |

### Control Flow

| Method | Description |
|--------|-------------|
| `if: cond then: block` | Execute block if condition is true. *core* |
| `if: cond then: a else: b` | Execute a if true, b if false. *core* |
| `if: c1 then: a else-if: c2 then: b else: c` | Two-branch conditional. *core* |
| `while: cond do: block` | Loop while condition block returns true. *core* |
| `while: a and: b do: block` | Loop while both conditions are true. *core* |
| `until: cond do: block` | Loop until condition block returns true. *core* |
| `loop: block` | Loop forever (until return). *core* |
| `do: block` | Execute a block immediately. *core* |
| `from: start to: end do: block` | Iterate from start to end (inclusive), calling block with each number. Step direction is automatic. *core* |
| `from: start to: end step: step do: block` | Same with explicit step. *core* |

### Classes

| Method | Description |
|--------|-------------|
| `class: proto` | Create a new class with the given instance prototype. *core* |
| `class: proto superclass: parent` | Create a new class with a custom superclass. *native* |

### Async

| Method | Description |
|--------|-------------|
| `sleep: ms` | Return a promise that resolves after ms milliseconds. *native* |

### Message Dispatch

| Method | Description |
|--------|-------------|
| `send: message to: receiver arguments: args` | Send a message dynamically. Useful for forwarding captured messages. *native* |

### Schemes

| Method | Description |
|--------|-------------|
| `register-scheme: name handler: obj` | Register a custom scheme. The handler should respond to `read:`, `create:value:`, and `update:value:`. *native* |

## Switch/Case

The switch construct uses a Switches helper object for pattern matching:

```jay
s <- value switch
s case: "a" do: { "got a" }
s case: "b" do: { "got b" }
write: (s default: { "other" })
```

| Method | Description |
|--------|-------------|
| `case: value do: block` | Match by equality (or call value as predicate if it's a block). Returns self for chaining. *core* |
| `default: block` | Execute block if no case matched. Returns the result. *core* |
| `result` | Get the matched result without a default. *core* |

## true / false / nil

`true`, `false`, and `nil` are special objects.

- `true` responds to `not` with `false`, `if-true:else:` by calling the "then" block, and `to-string` with `"true"`.
- `false` responds to `not` with `true` (inherited from Object), `to-string` with `"false"`.
- `nil` is the absence of a value. It is JavaScript's `undefined` under the hood.

## Module

Each file runs as a module with access to a `module` variable.

| Method | Description |
|--------|-------------|
| `import: path` | Import another Jay file (relative to this file). Returns the imported module's exports. Requires `await`. *native* |
| `exports` | Get this module's exports object. *native* |
