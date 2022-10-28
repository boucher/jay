import Parser from "../../language/parser.js"
import { Lexer } from '../../language/lexer.js'
import Compiler from '../../language/compile.js'

import "../../language/runtime.js";

const coreCode = compile(require("../../language/core/core.fin"), false);
eval?.(coreCode)

const nativeLog = console.log
console.log = function(m) {
  nativeLog(m)
  postMessage({ type: "log", log: m })
}

function run(source) {
  let code, result

  try {
    code = compile(source)
    result = eval?.(code)

    return {
      type: "end",
      code: code,
      result: result?.toString() || "null",
    }
  } catch (e) {
    return {
      type: "end",
      code: code,
      error: e
    }
  }
}

function compile(source, inline=true) {
  let lexer = new Lexer("repl", source);
  let parser = new Parser(lexer.each());

  try {
    var expressions = parser.parse();  
  } catch(e) {
    parser.errors.push(e)
  }

  if (parser.errors.length) {
    throw parser.errors.join("\n")
  } 

  return Compiler.compile(expressions, inline);
}

addEventListener('message', (event) => {
  postMessage(run(event.data))
})