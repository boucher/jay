import Image from 'next/image'
import Link from 'next/link';

export default function Home() {
  return (<>
    <p>
      Jay is a dynamically-typed, <a href="http://en.wikipedia.org/wiki/Object-oriented_programming">object-oriented</a>, <a href="http://en.wikipedia.org/wiki/Prototype-based_programming">prototype-based</a> programming language that  compiles to  <a href="https://developer.mozilla.org/en/About_JavaScript">JavaScript</a>. It is based on the <a href="http://finch.stuffwithstuff.com/index.html">Finch</a> language created by <a href="https://twitter.com/munificentbob">Bob Nystrom</a>, which itself is inspired by <a href="http://www.smalltalk.org/main/">Smalltalk</a>, <a href="http://selflanguage.org/">Self</a>, and JavaScript.
    </p>

    <p>
      This project is a hobby that does not currently aim to serve any particular purpose other than exploration. If you have thoughts on the language, I'd love to hear them. At the moment, it is almost exactly a re-implementation of Finch in JS. I hope to change the syntax slightly to be slightly more familiar for someone with a background in JS.
    </p>

    <p>
      Because the language compiles to JavaScript, some things need to be worked out for how to bridge between the two languages. Currently, Jay names are mangled during compilation, so you do not have direct access to JS variables in the environment. Methods are compiled as functions directly attached to objects, and dispatched as normal JS method calls. Native JS types like Array and Number are bridged to their Jay equivalents.
    </p>


    <h2>Getting Started</h2>

    <p>
      <Link href="/repl">Try it in your browser</Link>, or you can check out <a href="http://github.com/boucher/jay">the source on Github</a>.
    </p>

    <h2>A Taste of the Language</h2>

    <p>
      Here's a little example to get you going. This little program doesn't draw, but it will tell you what turns to make to draw a dragon curve:
    </p>

    <pre><code className="block">
{`// create an object and put it in a variable "dragon"
dragon <- [
  // define a "trace:" method for outputting the series of left and
  // right turns needed to draw a dragon curve.
  trace: depth {
    self trace-depth: depth turn: "R"
    write-line: "" // end the line
  }

  // the main recursive method
  trace-depth: n turn: turn {
    if: n > 0 then: {
      self trace-depth: n - 1 turn: "R"
      write: turn
      self trace-depth: n - 1 turn: "L"
    }
  }
]

// now let's try it
dragon trace: 5
`}
    </code></pre>

  </>)
}
