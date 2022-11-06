import loader from "@monaco-editor/loader";
import { useEffect, useState, useRef } from 'react'
import { loadWASM,  } from 'onigasm' // peer dependency of 'monaco-textmate'
import { Registry } from 'monaco-textmate' // peer dependency
import { wireTmGrammars } from 'monaco-editor-textmate'

function EditorComponent(props) {
  const wrapper = useRef();

  const [isComponentMounted, setIsComponentMounted] = useState(false)
  useEffect(() => setIsComponentMounted(true), [])

  useEffect(() => {
    (async function(){
      if (!isComponentMounted) return

      const JaySyntaxJSON = require("../../highlighting/syntaxes/jay.tmLanguage.json")
      const Theme = require("../../highlighting/monokai-theme.json")
      
      await loadWASM("https://unpkg.com/onigasm/lib/onigasm.wasm") // See https://www.npmjs.com/package/onigasm#light-it-up

      const registry = new Registry({
        getGrammarDefinition: async (scopeName) => {
            return {
                format: 'json',
                content: JaySyntaxJSON
            }
        }
      })
  
      const grammars = new Map()
      grammars.set('jay', 'source.jay')
  
      let monaco = await loader.init()
  
      monaco.languages.register({ id: "jay" });
      monaco.editor.defineTheme('converted', Theme);        
  
      let editor = monaco.editor.create(wrapper.current, {
        value: "",
        language: 'jay', // this won't work out of the box, see below for more info,
        theme: 'converted', // very important, see comment above
        overviewRulerBorder: false,
        renderLineHighlight: "none",
        scrollBeyondLastLine: false,
        scrollbar:{ 
          useShadows: false
        },
        minimap:{
          enabled: false
        },
        padding: {
          top: 8, bottom: 8
        }
      })
  
      editor.addAction({
        id: 'execute',
        label: 'Execute',
        keybindings: [
          monaco.KeyMod.Shift | monaco.KeyCode.Enter
        ],
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1,
        run: props.execute
      });
  
      await wireTmGrammars(monaco, registry, grammars, editor)
  
      props.editor.current = editor;
    })()
  }, [isComponentMounted]);

  /*


    <Editor 
      height={400}
      defaultLanguage="jay"
      theme="vs-code-theme-converted"
      onMount={handleEditorDidMount}
      options={{
        overviewRulerBorder: false,
        renderLineHighlight: "none",
        scrollBeyondLastLine: false,
        scrollbar:{ 
          useShadows: false
        },
        minimap:{
          enabled: false
        }
      }}
    />
  */

  return <div className={ props.className } ref={ wrapper }></div>
}

export default EditorComponent;