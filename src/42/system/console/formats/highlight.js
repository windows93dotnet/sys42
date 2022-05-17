// @thanks https://github.com/mochajs/mocha/blob/master/lib/browser/highlight-tags.js
// @thanks http://prismjs.com

import { escapeLog } from "../logUtils.js"
import setup from "../../../system/setup.js"

const DEFAULTS = {
  colors: {
    true: "bright.cyan",
    false: "bright.magenta",
    string: "yellow",
    number: "magenta",
    regex: "cyan",
    console: "bright.cyan",
    function: "bright.red",
    comment: "dim.bright.magenta",
    operator: "bright.green",
    punctuation: "white.dim",
    keyword: "bright.green",
    builtin: "bright.blue",
  },
}

const configure = setup("highlight", DEFAULTS)

const COMMENT_PLACEHOLDER = `#COMMENT_${42}`
const NUMBER_PLACEHOLDER = `#NUMBER_${42}`
const REGEX_PLACEHOLDER = `#REGEX_${42}`
const STRING_PLACEHOLDER = `#STRING_${42}`
const FUNCTION_PLACEHOLDER = `#FUNCTION_${42}`
// const BACKSLASH_PLACEHOLDER = `#BACKSLASH_${42}`

const REGEX_PLACEHOLDER_REGEX = new RegExp(`${REGEX_PLACEHOLDER}(\\d+)`, "g")
const STRING_PLACEHOLDER_REGEX = new RegExp(`${STRING_PLACEHOLDER}(\\d+)`, "g")

// Licence for regexes from prismjs
//! Copyright (c) 2012 Lea Verou. MIT Licence.

const KEYWORD_REGEX =
  /(^|[^.]|\.\.\.\s*)\b(as|async|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|for|from|function|(?:get|set)(?=\s*[\w$[\u00A0-\uFFFF])|if|implements|import|in|instanceof|interface|let|new|of|package|private|protected|public|return|static|super|switch|throw|try|typeof|var|void|while|with|yield)\b/g
const BUILTIN_REGEX =
  /\b(AggregateError|Array|ArrayBuffer|AsyncFunction|Atomics|BigInt|BigInt64Array|BigUint64Array|Boolean|DataView|Date|Error|EvalError|Float32Array|Float64Array|Function|Generator|GeneratorFunction|globalThis|Int16Array|Int32Array|Int8Array|InternalError|Intl|JSON|Map|Math|Number|Object|Promise|Proxy|RangeError|ReferenceError|Reflect|RegExp|Set|SharedArrayBuffer|String|Symbol|SyntaxError|TypeError|Uint16Array|Uint32Array|Uint8Array|Uint8ClampedArray|URIError|WeakMap|WeakSet|WebAssembly)\b/g
const PUNCTUATION_REGEX = /([(),.:;[\]{}]|\\{|\\})+/g
const REGEX_REGEX =
  /(^|[\s!&(,.;=[{|])(\/(?!\/|\*)(?:\[.+?]|\\.|[^\n\r/])+\/[gimuy]{0,5})(?=\s*([\n\r),.;\]}]|$))/g
const STRING_REGEX =
  /(["'])(?:\\(?:\r\n|[\S\s])|(?!\1)[^\n\r\\])*\1|`(?:\\[\S\s]|(?!`)[^\\])*`/g
const COMMENT_REGEX = /\/\*[\W\w]*?\*\/|\/\/.*$/gm
const FUNCTION_REGEX =
  /#?[$A-Z_a-z\u00A0-\uFFFF][\w$\u00A0-\uFFFF]*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/g
const NUMBER_REGEX =
  /-?\b((0[BOXbox][\dA-F_a-f]+)|(\d+(([Ee][+-]?\d+)|_|\d)*|Infinity))n?\b/g
const OPERATOR_REGEX =
  /[+-]{1,2}|!|<=?|>=?|={1,3}|&{1,2}|\|?\||\?|\*|\/|~|\^|%/g

const makeList = () => ({ list: [], i: 0 })

export default function highlight(js, options) {
  const config = configure(options)

  const { colors } = config

  const _string = makeList()
  const _regex = makeList()
  const _comment = makeList()
  const _number = makeList()
  const _function = makeList()

  function toPlaintext(str) {
    str = str
      .replace(STRING_PLACEHOLDER_REGEX, (_, i) => _string.list[i])
      .replace(REGEX_PLACEHOLDER_REGEX, (_, i) => _regex.list[i])

    return str
  }

  function isInObject(_, args) {
    const str = args[args.length - 1]
    const pos = args[args.length - 2]
    const slice = str.slice(pos + _.length)
    return (
      slice.startsWith(`{${colors.punctuation} :`) ||
      slice.startsWith(`{${colors.punctuation} (`)
    )
  }

  return escapeLog(js)
    .replace(
      REGEX_REGEX,
      (_, a, b) => a + REGEX_PLACEHOLDER + (_regex.list.push(b) - 1)
    )
    .replace(
      STRING_REGEX,
      ($) => STRING_PLACEHOLDER + (_string.list.push($) - 1)
    )

    .replace(
      COMMENT_REGEX, //
      ($) => {
        _comment.list.push($)
        return COMMENT_PLACEHOLDER
      }
    )
    .replace(
      FUNCTION_REGEX, //
      ($) => {
        if ($ === COMMENT_PLACEHOLDER) return $
        _function.list.push($)
        return FUNCTION_PLACEHOLDER
      }
    )
    .replace(
      NUMBER_REGEX, //
      ($) => {
        _number.list.push($)
        return NUMBER_PLACEHOLDER
      }
    )

    .replace(
      PUNCTUATION_REGEX, //
      ($) => `{${colors.punctuation} ${$}}`
    )
    .replace(
      OPERATOR_REGEX, //
      (_, ...args) => (isInObject(_, args) ? _ : `{${colors.operator} ${_}}`)
    )
    .replace(
      /\btrue\b/g, //
      (_, ...args) => (isInObject(_, args) ? _ : `{${colors.true} ${_}}`)
    )
    .replace(
      /\bfalse\b/g, //
      (_, ...args) => (isInObject(_, args) ? _ : `{${colors.false} ${_}}`)
    )
    .replace(
      /((?:^|})\s*)(?:catch|finally)\b/, //
      (_, ...args) => (isInObject(_, args) ? _ : `{${colors.keyword} ${_}}`)
    )
    .replace(
      KEYWORD_REGEX, //
      (_, ...args) =>
        isInObject(_, args) ? _ : `${args[0]}{${colors.keyword} ${args[1]}}`
    )
    .replace(
      BUILTIN_REGEX, //
      (_, ...args) =>
        isInObject(_, args) ? _ : `{${colors.builtin} ${args[0]}}`
    )
    .replace(
      /\b(NaN|null|undefined|arguments|this)\b/g, //
      (_, ...args) =>
        isInObject(_, args) ? _ : `{${colors.number} ${args[0]}}`
    )
    .replace(
      /\b(console)\b/g, //
      (_, ...args) =>
        isInObject(_, args) ? _ : `{${colors.console} ${args[0]}}`
    )

    .replaceAll(
      FUNCTION_PLACEHOLDER, //
      () => {
        const str = _function.list[_function.i++]
        const color = str.match(KEYWORD_REGEX)
          ? colors.keyword
          : str.match(BUILTIN_REGEX)
          ? colors.builtin
          : colors.function

        return `{${color} ${str}}`
      }
    )
    .replaceAll(
      NUMBER_PLACEHOLDER, //
      () => {
        let str = _number.list[_number.i++]
        str = str.replace(
          /([Ee][+-]|(0)([BOXbox])|_|n$)/g,
          (_, a) => `}{dim.${colors.number} ${a}}{${colors.number} `
        )
        return `{${colors.number} ${str}}`
      }
    )
    .replaceAll(
      STRING_PLACEHOLDER_REGEX, //
      (_, i) => {
        const str = _string.list[i] ?? ""
        const quote = `{${colors.string}.dim ${str[0]}}`
        const body = str.slice(1, -1)
        // .replace(/\\\\/g, BACKSLASH_PLACEHOLDER) // TODO: fix escaped backslash in parseLogTemplate
        // // .replace(/\\(u([a-f]|\d){4}|[^\\{}])/g, `{bright.${colors.regex} $&}`)
        // .replace(/\\(u([A-Fa-f]|\d){4}|[^\\{}])/g, `{${colors.regex} $&}`)
        // .replaceAll(BACKSLASH_PLACEHOLDER, `\\\\`)

        return `${quote}{${colors.string} ${body}}${quote}`
      }
    )
    .replaceAll(
      REGEX_PLACEHOLDER_REGEX,
      (_, i) => `{${colors.regex} ${_regex.list[i]}}`
    )
    .replaceAll(
      COMMENT_PLACEHOLDER,
      () => `{${colors.comment} ${toPlaintext(_comment.list[_comment.i++])}}`
    )
}
