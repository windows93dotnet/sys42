import { esc, escapeLog } from "../logUtils.js"
import normalizeError from "../../../fabric/type/error/normalizeError.js"
import serializeError from "../../../fabric/type/error/serializeError.js"
import formatEntries from "./formatEntries.js"
import formatFilename from "./formatFilename.js"
import configure from "../../../fabric/configure.js"
import truncate from "../../../fabric/type/string/truncate.js"

const DEFAULTS = {
  compact: false,
  colors: {
    message: "red",
    errorName: "grey",
    function: "red.dim",
    punctuation: "grey",
  },
  entries: {
    preset: "javascript",
    newline: "\n",
    colors: { key: `red.dim`, colon: "grey.dim" },
  },
  filename: {
    colors: { line: "red" },
  },
}

export default function formatError(error, options) {
  const config = configure(DEFAULTS, options)
  const { colors } = config

  const obj =
    error instanceof Error ||
    ("ErrorEvent" in globalThis && error instanceof ErrorEvent)
      ? serializeError(normalizeError(error))
      : error

  let out = `{${colors.message} ${escapeLog(obj.message)}}\n`

  if (error.stack !== `${error.name}: ${error.message}`) {
    out += esc`\
{${colors.punctuation} ${obj.stack.length > 0 ? "┌╴" : "╶╴"}}\
{${colors.errorName} ${
      error.name ||
      ("ErrorEvent" in globalThis && error instanceof ErrorEvent
        ? "ErrorEvent"
        : "?")
    }}`

    // console.log(obj.stack)

    const fnNames = []

    for (const stack of obj.stack) {
      stack.function = stack.function.replace(/^Object\./, "{}.")
      stack.function = truncate(stack.function, {
        max: 30,
        ending: " …",
        firstBreak: " ",
      })
      fnNames.push(stack.function.length)
    }

    // let maxFnName = Math.max(...obj.stack.map((x) => x.function.length))
    let maxFnName = Math.max(...fnNames)
    if (maxFnName) maxFnName += 1

    // prevent vscode to ignore link in terminal
    // if there is no space before lineLocation
    const dash = maxFnName ? "╴" : " "

    for (let i = 0; i < obj.stack.length; i++) {
      const element = obj.stack[i]
      const lineLocation = formatFilename(element, config.filename)
      const functionName = element.function
        ? escapeLog(element.function.padEnd(maxFnName))
        : " ".repeat(maxFnName)
      out += `{${colors.punctuation} ${
        i === obj.stack.length - 1 ? "\n└" : "\n├"
      }${dash}}{${colors.function} ${functionName}}${lineLocation}`
    }
  }

  const d = obj.details

  if (d.errorEvent?.message === obj.message) {
    d.errorEvent = { type: d.errorEvent.type }
  }

  const details = formatEntries(d, config.entries)

  if (details) {
    if (!config.compact) out += `\n`
    out += `\n${details}`
  } else if (!config.compact) out += `\n`

  return out
}
