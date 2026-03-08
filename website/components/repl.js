import Parser from "../../language/parser.js"
import { Lexer } from '../../language/lexer.js'
import Compiler from '../../language/compile.js'

function compile(source, path="") {
  let lexer = new Lexer(path, source);
  let parser = new Parser(lexer.each());

  try {
    var expressions = parser.parse();  
  } catch(e) {
    parser.errors.push(e)
  }

  if (parser.errors.length) {
    throw parser.errors.join("\n")
  } 

  return Compiler.compile(expressions, false);
}

globalThis.$compile = compile;

globalThis.$Runtime = {
  readFile: function() { return null },
  writeFile: function() { },
  fileExists: function() { return false }
}

globalThis.__dirname = ""

import "../../language/runtime.js";

const coreCode = compile(require("../../language/core/core.jay"), "core.jay");
eval?.(coreCode)

const nativeLog = console.log
console.log = function(m) {
  nativeLog(m)
  postMessage({ type: "log", log: m })
}

async function run(source) {
  let code, result

  try {
    code = compile(source, "repl")
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

addEventListener('message', async (event) => {
  postMessage(await run(event.data))
})