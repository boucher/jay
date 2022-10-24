'use strict' 
import { readFileSync } from "node:fs"
import readline from "node:readline"
import { SaferEval } from "safer-eval"

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
    if (this.hadError) process.exit(65);
    console.log(result);
    process.exit(0)
  }

  static runPrompt() {
    this.interpreter = new SaferEval({
      $Object: {},
      $Arrays: {},
      $Ether: {},
      $Blocks: {},
      $Fibers: {},
      $Numbers: {},
      $Strings: {},
      True: {},
      False: {},
      Nil: {},
    });

    const runtimeCode = readFileSync("./runtime.js", "utf-8");
    const coreCode = this.compile("./core/core.fin", readFileSync("./core/core.fin").toString('utf-8'));
    
    this.interpreter.runInContext(runtimeCode)
    this.interpreter.runInContext(coreCode)

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });
    
    rl.on('line', (line) => {
        if (line != null) {
          if (line.charAt(line.length - 1) !== ';') {
            line += ';';
          }

          let result = this.run(line, true);
          if (result) {
            console.log(result);
          }

          this.hadError = false;
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
    let code = this.compile("repl", source)
    console.debug(code)
    return this.interpreter.runInContext(code)
  }

  static compile(path, source) {
    let lexer = new Lexer(path, source);
    let parser = new Parser(lexer.each());
    let expressions = parser.parse();
    return Compiler.compile(expressions);
  }

  static printPrompt() {
    process.stdout.write("🐰> ");
  }

  static scanError(line, message) {
    this.report(line, "", message);
  }

  static parseError(token, message) {
    if (token.type == TokenType.EOF) {
      this.report(token.line, " at end", message);
    } else {
      this.report(token.line, ` at '${token.lexeme}'`, message);
    }
  }

  static report(line, where, message) {
    console.error("[line " + line + "] Error" + where + ": " + message);
    this.hadError = true;
  }

}  

Finch.main()
