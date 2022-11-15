import { useEffect, useState, useRef, useCallback } from 'react'
import styles from '../styles/Repl.module.css'
import EditorComponent from '../components/editor'

const snippets = {
dragon: `// create an object and put it in a variable "dragon"
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
dragon trace: 5`,

fib: `// add a fib method to Numbers
Number proto :: fib {
  if: self = 0 then: { return 0 }
  if: self = 1 then: { return 1 }
  (self - 2) fib + (self - 1) fib
}

// print sequence
from: 0 to: 20 do: {|i|
  write-line: "" + i + " fib = " + i fib
}`
};

export default function REPL() {
  const workerRef = useRef()
  const editorRef = useRef()

  let [result, setResult] = useState({})
  let [log, setLog] = useState([])

  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../components/repl.js', import.meta.url))
    }
    const onMessage = (event) => {
      switch(event.data.type) {
        case "log": 
          log += event.data.log
          setLog(log)
          break
        case "end":
          setResult(event.data)
          workerRef.current.terminate()
          workerRef.current = undefined
          break
      }
    }
    workerRef.current.onmessage = onMessage  
  }, [log, setLog, result, setResult, workerRef])

  const execute = useCallback(() => {
    setLog("")
    workerRef.current?.postMessage(editorRef.current.getValue().trim())
  }, [editorRef])

  return (<>
    <div className={ styles.instructions }>
      <p>
        Enter some code here to give Jay a try.
      </p>
      <ul>
        <li><a href="#" onClick={() => { editorRef.current.setValue(snippets.dragon) }}>dragon</a></li>
        <li><a href="#" onClick={() => { editorRef.current.setValue(snippets.fib) }}>fibonacci</a></li>
      </ul>
    </div>

    <EditorComponent className={ styles.replInput } editor={ editorRef } execute={ execute } />

    <div className={ styles.submit }>
      <button onClick={execute}>evaluate</button>
      <span>or press shift + enter</span>
    </div>

    <h4>Result</h4>
    { (result.result || log) && 
      <div className={ styles.replResult }>
        { log && <pre className={ styles.log }>{ log }</pre> }
        { result.result && <pre>{ result.result }</pre> }
      </div>
    }

    { result.error && 
      <div className={ styles.replError }>
        <pre>{ result.error.toString() }</pre>
      </div>
    }

    { result.code && 
      <div className={ styles.replCode }>
        <h4>Compiled source</h4>
        <pre>{ result.code }</pre>
      </div>
    }

  </>)
}