import { readFileSync } from "node:fs"
import readline from "node:readline"

import Parser from "./parser.js"
import { Lexer } from './lexer.js'
import PrettyPrinter from './print.js'

class Finch {
  
  static main() {
    const args = process.argv.slice(2);
    if (args.length > 1) {
      console.log("Finch Usage: node main.js [script]");
      process.exit(64); 
    } else {
      this.compileFile(args[0]);
    }
  }

  static compileFile(path) {
    let source = readFileSync(path).toString('utf-8');
    let lexer = new Lexer(path, source);
    let parser = new Parser(lexer.each());
    let expressions = parser.parse();

    // Stop if there was a syntax error.
    if (parser.errors.length) {
      parser.errors.forEach(console.error)
      process.exit(65)
    }

    debugger
    console.log(expressions.prettyPrint())
  }
  
  /*
  static hadError = false;
  static hadRuntimeError = false;

  static main() {

    this.parser = new FinchParser();
    this.interpreter = new Interpreter();

    const args = process.argv.slice(2);
    if (args.length > 1) {
      console.log("JSLOX Usage: node main.js [script]");
      process.exit(64); 
    } else if (args.length == 1) {
      this.runFile(args[0]);
    } else {
      this.runPrompt();
    }
  }

  static runFile(path) {
    this.run(fs.readFileSync(path).toString('utf-8'));
    if (this.hadError) process.exit(65);
    if (this.hadRuntimeError) process.exit(70);
  }

  static runPrompt() {
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

  static run(source, allowSingleExpression=false) {
    let scanner = new Scanner(source);
    let tokens = scanner.scanTokens();
    let parser = new Parser(tokens);
    let statements = parser.parse(allowSingleExpression);

    // Stop if there was a syntax error.
    if (this.hadError) return;

    let resolver = new Resolver(this.interpreter);
    resolver.resolve(statements);

    // Stop if there was a resolution error.
    if (this.hadError) return;

    //console.log(AstPrinter.print(statements));
    return this.interpreter.interpret(statements);
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

  static resolveError(token, message) {
    this.report(token.line, ` at '${token.lexeme}'`, message);
  }

  static runtimeError(error) {
    console.error(error.message +"\n[line " + error.token.line + "]");
    this.hadRuntimeError = true;
  }

  static report(line, where, message) {
    console.error("[line " + line + "] Error" + where + ": " + message);
    this.hadError = true;
  }
  */

}  

Finch.main()
