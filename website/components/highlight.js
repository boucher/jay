import withShiki from '@stefanprobst/rehype-shiki'
import toHtml from 'rehype-stringify'
import fromMarkdown from 'remark-parse'
import toHast from 'remark-rehype'
import * as shiki from 'shiki'
import { unified } from 'unified'

const JayRules = require("../../highlighting/syntaxes/jay.tmLanguage.json")

async function createProcessor(options = {}) {

  const jay = {
    id: 'jay',
    scopeName: 'source.jay',
    grammar: JayRules,
  }

  const highlighter = await shiki.getHighlighter({ theme: 'monokai', langs: [ ...shiki.BUNDLED_LANGUAGES, jay ] })

  const processor = unified()
    .use(fromMarkdown)
    .use(toHast)
    .use(withShiki, { highlighter, ...options })
    .use(toHtml)

  return processor
}

let processor;
export default async function getProcessor() {
  if (!processor) {
   processor = await createProcessor()
  }

  return processor
}