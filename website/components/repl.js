import Parser from "../../language/parser.js"
import { Lexer } from '../../language/lexer.js'
import Compiler from '../../language/compile.js'

import "../../language/runtime.js";

const coreCode = compile(require("../../language/core/core.jay"), false);
eval?.(coreCode)

const nativeLog = console.log
console.log = function(m) {
  nativeLog(m)
  postMessage({ type: "log", log: m })
}

async function run(source) {
  let code, result

  try {
    code = compile(source)
    result = await eval?.(code)

    return {
      type: "end",
      code: code,
      result: result !== undefined && result['to-string']() || "null",
    }
  } catch (e) {
    return {
      type: "end",
      code: code,
      error: e.toString()
    }
  }
}

function compile(source, inline=false) {
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

addEventListener('message', async (event) => {
  postMessage(await run(event.data))
})