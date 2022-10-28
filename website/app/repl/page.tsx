"use client";
import { useEffect, useState, useRef, useCallback } from 'react'
import styles from './page.module.css'


export default function REPL() {
  const workerRef = useRef<Worker>()

  let [result, setResult] = useState({})
  let [log, setLog] = useState([])
  let [input, setInput] = useState("")

  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('./repl.ts', import.meta.url))
    }
    const onMessage = (event: MessageEvent) => {
      switch(event.data.type) {
        case "log": 
          log += event.data.log
          setLog(log)
          break
        case "end":
          setResult(event.data)
          workerRef.current = undefined
          break
      }
    }
    workerRef.current.onmessage = onMessage  
  }, [log, setLog, result, setResult, workerRef])

  const handleWork = useCallback(async () => {
    setLog("")
    workerRef.current?.postMessage(input.trim())
  }, [input])

  const handleKeyDown = useCallback(e => {
    if (e.key === 'Enter' && e.shiftKey) {
      handleWork()
      e.stopPropagation()
      e.preventDefault()
    } 
  }, [input])

  const handleText = useCallback( e => {
    console.log(e.target.value)
    setInput(e.target.value)
  }, [])

  return (<>
    <p>
      Enter some code here to give Jay a try.
    </p>

    <textarea className={ styles.replInput} value={input} onChange={handleText} onKeyDown={handleKeyDown} />

    <div className={ styles.submit }>
      <button onClick={handleWork}>evaluate</button>
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