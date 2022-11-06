import { useEffect, useState, useRef, useCallback } from 'react'
import styles from '../styles/Repl.module.css'
import EditorComponent from '../components/editor'

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
    <p>
      Enter some code here to give Jay a try.
    </p>

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