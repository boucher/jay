'use strict' 
import { readFileSync, writeFileSync, existsSync } from "node:fs"
import path from "node:path"
import readline from "node:readline"
import * as url from 'url';
//import { SaferEval } from "safer-eval"

import Parser from "./parser.js"
import { Lexer } from './lexer.js'
import PrettyPrinter from './print.js'
import Compiler from './compile.js'

class Finch {  

  static main() {
    const args = process.argv.slice(2);
    if (args.length > 1) {
      console.log("Jay Usage: node main.js [/path/to/finch-script]");
      process.exit(64); 
    } else if (args.length == 1) {
      this.runFile(args[0]);
    } else {
      this.runPrompt();
    }
  }

  static setupEnvironment() {
    const runtimeCode = readFileSync(new URL('./runtime.js', import.meta.url), "utf-8");
    const coreCode = this.compile("./core/core.jay", readFileSync(new URL('./core/core.jay', import.meta.url)).toString('utf-8'));

    // __dirname is not available in ES modules, so provide it for the compiled code
    globalThis.__dirname = url.fileURLToPath(new URL('.', import.meta.url))

    globalThis.$compile = (source, path) => this.compile(path, source)

    globalThis.$Runtime = {
      readFile: function(filePath) {
        try { return readFileSync(filePath, 'utf-8') }
        catch(e) { return null }
      },
      writeFile: function(filePath, content) {
        writeFileSync(filePath, content, 'utf-8')
      },
      fileExists: function(filePath) {
        return existsSync(filePath)
      }
    }

    eval?.(runtimeCode)
    eval?.(coreCode)

    globalThis.$Schemes["file"] = {
      read: function(filePath) {
        let content = $Runtime.readFile(filePath)
        return content != null ? content : Nil
      },
      create: function(filePath, value) {
        $Runtime.writeFile(filePath, value["to-string"]())
        return value
      },
      update: function(filePath, value) {
        if (!$Runtime.fileExists(filePath)) return Nil
        $Runtime.writeFile(filePath, value["to-string"]())
        return value
      }
    }

    globalThis.$Schemes["http"] = globalThis.$Schemes["https"] = {
      read: async function(urlPath) {
        try {
          let response = await fetch("https://" + urlPath)
          if (!response.ok) return Nil
          return await response.text()
        } catch(e) { return Nil }
      },
      create: async function(urlPath, value) {
        try {
          let response = await fetch("https://" + urlPath, {
            method: "POST",
            body: value["to-string"]()
          })
          if (!response.ok) return Nil
          return await response.text()
        } catch(e) { return Nil }
      },
      update: async function(urlPath, value) {
        try {
          let response = await fetch("https://" + urlPath, {
            method: "PUT",
            body: value["to-string"]()
          })
          if (!response.ok) return Nil
          return await response.text()
        } catch(e) { return Nil }
      }
    }
  }


  static async runFile(filePath) {
    this.setupEnvironment();

    globalThis.__dirname = path.resolve(path.dirname(filePath))

    let code = this.compile(filePath, readFileSync(filePath).toString('utf-8'));
    console.log(code, "--------------------");

    let result = await eval?.(code);
    console.log(result);

    process.exit(0)
  }

  static runPrompt() {
    this.setupEnvironment();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });
    
    rl.on('line', (line) => {
        if (line != null) {
          this.run(line, true);
          this.printPrompt();
        }
    });
    
    rl.once('close', () => {
         // end of input
         console.log("<done>");
     });

     this.printPrompt();
  }

  static run(source) {
    try {
      let code = this.compile("repl", source, true)
      console.debug(code)

      //return this.interpreter.runInContext(code)
      let result = eval?.(code)
      console.log(result)    
    } catch (e) {
      console.error(e)
    }
  }

  static compile(path, source, inline=false) {
    let lexer = new Lexer(path, source);
    let parser = new Parser(lexer.each());
    let expressions = parser.parse();

    if (parser.errors.length) {
      throw parser.errors
    } 

    return Compiler.compile(expressions, inline);
  }

  static printPrompt() {
    process.stdout.write("🐰> ");
  }

}  

Finch.main()
