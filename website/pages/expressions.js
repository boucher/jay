export default function Expressions() {
  return (<>
    <p>
      Expressions are the heart of any programming language—they're the building blocks for programs. Jay, like many functional languages but unlike most C-derived languages, does not have statements, only expressions. We'll go over the different kinds of expressions Jay supports, starting from the bottom up.
    </p>

    <h2>Comments</h2>
    <p>
      OK, technically comments aren't expressions, but here is as good a place as any to describe them. Line comments start with <code>//</code> and end at the end of the line:
    </p>

    <pre><code>// this is a comment</code></pre>

    <p>
      Block comments start with <code>/*</code> and end with <code>*/</code>. They can span multiple lines or be within a single one. Unlike C and others, block comments can nest in Jay:
    </p>

    <pre><code>/* this is /* a nested */ comment */</code></pre>

    <h2>Literals</h2>
    <p>
      Jay currently supports two atomic types: numbers and strings. Numbers are double-precision floating point values, and strings are text. Jay doesn't support a lot of fancy formats for them yet, just the basic:
    </p>

    <pre><code>
{`0
1234
-432.1
"a string"
"another string"
"supported escapes: \" \n \\"`}
  </code></pre>

    <p>
      Jay also has a couple of special standard objects. The object <code>nil</code> is used to indicate the absence of a value. <code>true</code> and <code>false</code> are boolean values that you can use with things like <code>if:then:</code> and <code>while:do:</code>. Unlike numbers and strings, these aren't built into the language. They are just regular objects implemented in Jay code that happen to do useful things.
    </p>

    <h2>Variables</h2>

    <p>
      Variable names in Jay are more flexible than in most other languages. They must begin with a letter or an underscore, but pretty much everything else is fair game. All of these are valid variable names:
    </p>

    <pre><code>
{`foo
Bar
best-friends4eva
_under_score_
I<3punctuation!!!!!1
`}
    </code></pre>

    <p>
      Jay has two kinds of variables. Normal variables are lexically scoped like other languages. Variables that start with an underscore <code>_</code> are fields. These are looked up on the object that the current method is being called on. In other words, when you see <code>_name</code>, it is translated to <code>this.name</code> in the compiled JavaScript.
    </p>

    <h2>Messages</h2>

    <p>
      What other languages refer to as "calling a function" or "invoking a method", Jay calls "sending a message." Sending a message to an object (and remember, everything is an object) invokes a <em>method</em> on that object. There are three flavors of message sends in Jay: unary, operator, and keyword.
    </p>

    <h3>Unary Messages</h3>

    <p>
      An <em>unary</em> message has a name but no arguments. You can send an unary message to an object by following the object with the name of the message:
    </p>

    <pre><code>{`// send the 'length' message to the string "hi there"
"hi there" length`}</code></pre>

    <h3>Operator Messages</h3>

    <p>
      A series of one or more punctuation characters is an <em>operator</em>. You can define whatever operators you like, but don't go too crazy. The goal here is not to make your code look like comic strip profanity:
    </p>

<pre><code>
{`// valid punctuation characters
+ - ! % ^ & * = < > / ? ~

// can also be combined
-- ?! -%- <=/=>`}
</code></pre>

    <p>
      All operators are <em>infix</em> &mdash; they have operands on both sides. Using an operator sends a message to the left-hand operand with the right-hand one as an argument.
    </p>

    <pre><code>a + b</code></pre>

    <p>
      The above expression means "send a <code>+</code> message to <code>a</code>, passing in <code>b</code> as an argument." Jay doesn't have any built-in operators: they're all just message sends.
    </p>

    <p>
      Because of this, all operators have the same precedence and associativity (left to right). This is unlike most other languages with hard-coded precedence levels. Parentheses are your friends here.
    </p>

    <p className="todo">
      I may change this to implement C style operator precedence. I think you will still be able to define custom operators, which will all be given the same precedence. Subscript operators are also a possibility.
    </p>

    <pre><code>{`1 + 2 * 3   // evaluates to 9 in Jay
1 + (2 * 3) // evaluates to 7`}</code></pre>

    <p>
      Because there are no built-in operators, there are no unary operators in Jay. Instead, it uses a unary message for what would be an unary operator in another language:
    </p>

    <pre><code>{`// Jay            C/JS/etc.
value neg        // -value
condition not    // !condition`}</code></pre>

    <h3>Keyword Messages</h3>

    <p>
      Another way to pass messages (and the only way to pass more than one argument) is using keywords messages. A single keyword is a name terminated by a colon <code>:</code>, or just a colon by itself. A keyword message is formed by alternating keywords and arguments. An example will help here:
    </p>

    <pre><code>dictionary add-key: "some key" value: "the value"</code></pre>

    <p>
      This sends the <code>add-key:value:</code> message to the <code>dictionary</code> object, passing in <code>"some key"</code> and <code>"the value"</code> as arguments. You can (currently) chain up to 10 keywords in a single message. Another example:
    </p>
    
    <pre><code>chef cook-soup: tomato appetizer: calimari entree: veal dessert: cake</code></pre>

    <p>That sends a single <code>cook-soup:appetizer:entree:dessert:</code> message to chef with four arguments.</p>

    <p>
      Like other messages, keyword messages usually follow a receiver (dictionary and chef in the above examples). However, you can also omit the receiver. In that case, it will implicitly be sent to a special <code>Ether</code> object:
    </p>

    <pre><code>{`// this:
write: "hi"
// is equivalent to:
Ether write: "hi"`}</code></pre>

    <p>
      Most of Jay's control flow operations like <code>if:then:</code> and <code>while:do</code> are defined as methods on <code>Ether</code>.
    </p>

    <h2>Sequences</h2>

    <p>
      Multiple expressions can be sequenced together into a single expression by separating them with commas.
    </p>

    <pre><code>write: "hi", write: "bye"</code></pre>

    <p>
      This code forms a single expression that writes "hi" and then "bye". When executed, a sequence evaluates each of its expressions in order, and then returns the result of the last one.
    </p>

    <p>
      To make things a little cleaner, Jay also treats newlines as commas in places where that makes sense. In other words, we could write the above just as:
    </p>

    <pre><code>{`write: "hi"
write: "bye"`}</code></pre>

    <p>
      This doesn't mean <em>all</em> newlines will be treated as commas. If the end of a line is obviously not the end of an expression, a newline will be ignored. For example:
    </p>

    <pre><code>{`write: 1 +
  2
// prints 3`}</code></pre>

    <p>Since a <code>+</code> can't end an expression, the newline after is ignored and it continues onto the next line.</p>

    <h2>Cascades</h2>

    <p>
      Sometimes you want to send a series of messages to the same object. To avoid making you repeat the receiver over and over, you can cascade messages by separating them with semicolons <code>;</code>. Instead of doing:
    </p>

    <pre><code>{`file write: "A line"
file << "Another line"
file write: "A third"
file close`}</code></pre>

    <p>You can instead do:</p>

    <pre><code>{`file write: "A line" ; << "Another line" ; write: "A third" ; close`}</code></pre>

    <h2>Blocks</h2>

    <p>
      Jay looks like a lot of other languages in that curly braces define local blocks:
    </p>

    <pre><code>{`{
  write: "inside a block"
}`}</code></pre>

    <p>
      However, these blocks aren't what you think they are. When you enclose an expression in curly braces, you're actually creating a block object. A block object is essentially a closure or a local function. It's an object that contains a chunk of code and a lexical scope (i.e. its own set of local variables). It compiles down to a JavaScript function.
    </p>

    <p>
      When you create a block, the code inside it isn't immediately executed. It's just packaged up into the block object. The above example won't actually print anything. To invoke the code inside a block, you send the block object a call message:
    </p>

    <pre><code>{`{ write: "inside a block" } call`}</code></pre>

    <h3>Blocks are Objects</h3>

    <p>
      It's important to realize that blocks really are just objects. They can be stored in variables, passed to methods, etc. In fact, Jay doesn't have any built-in flow control structures. Consider:
    </p>

    <pre><code>{`if: a < b then: {
  write: "less"
} else: {
  write: "greater"
}`}</code></pre>

    <p>
      That looks like some built-in if/then construct. It isn't. What you're looking at is an <code>if:then:else:</code> keyword message being sent to <code>Ether</code>. The two blocks are arguments that are sent with the message. The implementation of that method looks at the first condition argument, and decides which of the two blocks to call based on that.
    </p>

    <h3>Block Arguments</h3>

    <p>
      Because blocks are basically functions, you can also pass arguments to them. If a block has arguments, they appear after the opening curly brace, surrounded by pipes <code>|</code>:
    </p>

    <pre><code>{`{|a b| a + b }`}</code></pre>

    <p>
      The above code creates a block that takes two arguments. When called, it returns the sum of the arguments. You pass arguments to a block by using one of the keyword versions of <code>call</code>. For example:
    </p>

    <pre><code>{`{|a| write: a } call: "arg" // one argument
{|a b| write: a + b } call: "one" : "two" // two args
{|a b c| write: a + b + c } call: "one" : "two" : "three" // three`}</code></pre>

    <p>
      If you pass too many arguments to a block, the extra ones will be ignored. If you don't pass enough, it will assign the special value nil to the missing ones.
    </p>

    <h3>Return</h3>

    <p>
      Because control structures are implemented as blocks and messages, it can be frustrating if you want to bail early. For this, there is a <code>return</code> expression, which will take whatever argument is passed on the right and return it from the enclosing method.
    </p>

    <pre><code>{
`obj <- [
  early?: return-early {
    if: return-early then: {
      return "Early!"
    }
    // do something else
    return "Late!"
  }
]

write: (obj early?: true) // prints Early!
write: (obj early?: false) // prints Late!`}</code></pre>

    <h2>Assignment</h2>

    <p>
      Variables are declared and given values using assignment expressions. An assignment expression is simply a name followed by an assignment arrow, followed by some expression for the value to assign to the variable. For example:
    </p>

    <pre><code>{`a <- "some value"`}</code></pre>

    <p>
      Variables do not have to be explicitly declared &mdash; assigning it a value will create it if it doesn't already exist. The value returned by an assignment expression is the assigned value. For example:
    </p>

    <pre><code>{`write: (a <- "hi")`}</code></pre>

    <p>
      This creates a variable <code>a</code>, assigns "hi" to it, then prints "hi".
    </p>

    <h3>Short and Long Assignment</h3>

    <p>
      There are actually two kinds of assignment in Jay: short and long. The <code>{"<-"}</code> operator is short assignment and is what you'll use most of the time. It assigns to a variable in the current scope. If you want to avoid creating a new variable in the current scope and instead assign to an existing variable defined in an outer scope, you use the long assignment arrow: <code>{`<--`}</code>.
    </p>

    <pre><code>
{`a <- "outside"
do: {
  a <- "inside"
}
write: a`}
    </code></pre>

    <p>
      This chunk of code will display "outside". The assignment inside the <code>do:</code> block creates a new <code>a</code> variable local to that block. When the block ends, that <code>a</code> is discarded and the outer one remains. Let's change it to use long assignment:
    </p>

    <pre><code>
{`a <- "outside"
do: {
  a <-- "inside"
}
write: a`}
    </code></pre>
 
    <p>
      Now this code will print "inside". The <code>a {'<--'} "inside"</code> line now means "walk up the scope chain looking for an existing variable named a and assign to it." (If it fails to find a previously declared variable to assign to, it will throw an error.)
    </p>

    <p>
      One way you can think of this is that short assignment always means "declare a new variable in the current scope" and long assignment means "assign to an existing one."
    </p>

    <h2>Arrays</h2>

    <p>
      Jay has built-in support for resizable arrays. Most of the things you can do with arrays use normal message syntax, but there's also a little special sauce for creating arrays. A hash <code>#</code> followed a series of expressions in square brackets creates an array with an element for the value of each expression. Elements are separated with commas (or newlines) like a normal sequence.
    </p>

    <p className="todo">I would like to remove the hash, and potentially use it for object literals instead</p>

    <pre><code>
{`#[]             // creates an empty array
#[1, 2, 3]      // a three-element array
#[123, "text"]  // arrays can have elements of different types
#[1 + 2, 3 neg] // expressions are fine too

// newlines can separate elements too
#["first"
  "second"
  "third"]
`}
    </code></pre>

    <p>
      Arrays are objects like everything else, so they can be stored in variables, passed to methods, etc. They are bridged to native JS arrays.
    </p>

    <h2>Precedence and Associativity</h2>

    <p>
      OK, so we've got the building blocks. Now let's talk about how they interact. The two keys parts are precedence and associativity. Precedence determines which expressions bind "tighter" when different expression types are mixed together. From lowest (loosest) to highest, we have: binds, sequences, assignment, keyword messages, operators, then unary messages. For example, given an expression like this:
    </p>

    <pre><code>
{`a <- 8 + 2 neg mod: 4 - 2
write: a
`}
    </code></pre>

    <p>Jay will parse that like this:</p>

    <pre><code>
{`((a <- ((8 + (2 neg)) mod: (4 - 2))), (write: a))`}  
    </code></pre>

    <p>
      Associativity controls how a series of the same type of expression is interpreted. Unary and operator messages associate to the left. A series of keywords will be parsed into a single keyword. Assignment is right-associative. Or, by example:
    </p>

    <pre><code>
{`3 neg abs square            // is parsed as (((3 neg) abs) square)
1 + 2 * 3 - 4               // is parsed as (((1 + 2) * 3) - 4)
dict addKey: 123 value: "v" // is parsed as a single "addKey:value:" message
a <- b <- c <- 4            // is parsed as (a <- (b <- (c <- 4)))
`}  
    </code></pre>
  </>)
}
