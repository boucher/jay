'use strict' 
import { readFileSync } from "node:fs"
import readline from "node:readline"
//import { SaferEval } from "safer-eval"

import Parser from "./parser.js"
import { Lexer } from './lexer.js'
import PrettyPrinter from './print.js'
import Compiler from './compile.js'

class Finch {  

  static main() {
    const args = process.argv.slice(2);
    if (args.length > 1) {
      console.log("Finch Usage: node main.js [/path/to/finch-script]");
      process.exit(64); 
    } else if (args.length == 1) {
      this.runFile(args[0]);
    } else {
      this.runPrompt();
    }
  }

  static runFile(path) {
    let result = this.compile(path, readFileSync(path).toString('utf-8'));
    console.log(result);
    process.exit(0)
  }

  static runPrompt() {
    //this.interpreter = new SaferEval({});

    const runtimeCode = readFileSync("./runtime.js", "utf-8");
    const coreCode = this.compile("./core/core.fin", readFileSync("./core/core.fin").toString('utf-8'));
    
    //this.interpreter.runInContext(runtimeCode)
    //this.interpreter.runInContext(coreCode)
    eval?.(runtimeCode)
    eval?.(coreCode)

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
