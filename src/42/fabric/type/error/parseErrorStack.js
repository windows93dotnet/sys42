// @src https://github.com/stacktracejs/error-stack-parser

const FIREFOX_SAFARI_STACK_REGEX = /(^|@)\S+:\d+/
const CHROME_IE_STACK_REGEX = /^\s*at .*(\S+:\d+|\(native\))/m
const SAFARI_NATIVE_CODE_REGEX = /^(eval@)?(\[native code])?$/

export function stackframe(obj) {
  const out = Object.create(null)
  out.filename = obj.filename
  out.line = Number(obj.line)
  out.column = Number(obj.column)
  out.function = obj.function
  Object.defineProperty(out, "source", { value: obj.source })
  return out
}

// Separate line and column numbers from a string of the form: (URI:Line:Column)
function extractLocation(urlLike) {
  // Fail-fast but return locations like "(native)"
  if (!urlLike.includes(":")) return [urlLike]

  const regExp = /(.+?)(?::(\d+))?(?::(\d+))?$/
  const parts = regExp.exec(urlLike.replace(/[()]/g, ""))
  return [parts[1], parts[2] || undefined, parts[3] || undefined]
}

function parseV8OrIE(error) {
  const filtered = error.stack
    .split("\n")
    .filter((line) => Boolean(line.match(CHROME_IE_STACK_REGEX)))

  return filtered.map((line) => {
    if (line.includes("(eval ")) {
      // Throw away eval information until we implement stacktrace.js/stackframe#8
      line = line
        .replace(/eval code/g, "eval")
        .replace(/(\(eval at [^()]*)|(\),.*$)/g, "")
    }

    let sanitizedLine = line.replace(/^\s+/, "").replace(/\(eval code/g, "(")

    // capture and preseve the parenthesized location "(/foo/my bar.js:12:87)" in
    // case it has spaces in it, as the string is split on \s+ later on
    const location = sanitizedLine.match(/ (\((.+):(\d+):(\d+)\)$)/)

    // remove the parenthesized location from the line, if it was matched
    sanitizedLine = location
      ? sanitizedLine.replace(location[0], "")
      : sanitizedLine

    const tokens = sanitizedLine.split(/\s+/).slice(1)
    // if a location was matched, pass it to extractLocation() otherwise pop the last token
    const locationParts = extractLocation(location ? location[1] : tokens.pop())
    const functionName = tokens.join(" ") || undefined
    const filename = ["eval", "<anonymous>"].includes(locationParts[0])
      ? undefined
      : locationParts[0]

    return stackframe({
      function: functionName,
      filename,
      line: locationParts[1],
      column: locationParts[2],
      source: line,
    })
  })
}

function parseFFOrSafari(error) {
  const filtered = error.stack
    .split("\n")
    .filter((line) => !line.match(SAFARI_NATIVE_CODE_REGEX))

  return filtered.map((line) => {
    // Throw away eval information until we implement stacktrace.js/stackframe#8
    if (line.includes(" > eval")) {
      line = line.replace(
        / line (\d+)(?: > eval line \d+)* > eval:\d+:\d+/g,
        ":$1"
      )
    }

    if (!line.includes("@") && !line.includes(":")) {
      // Safari eval frames only have function names and nothing else
      return stackframe({
        functionName: line,
      })
    }

    const functionNameRegex = /((.*".+"[^@]*)?[^@]*)@/
    const matches = line.match(functionNameRegex)
    const functionName = matches && matches[1] ? matches[1] : undefined
    const locationParts = extractLocation(line.replace(functionNameRegex, ""))

    return stackframe({
      function: functionName,
      filename: locationParts[0],
      line: locationParts[1],
      column: locationParts[2],
      source: line,
    })
  })
}

function parseOpera(e) {
  if (
    !e.stacktrace ||
    (e.message.includes("\n") &&
      e.message.split("\n").length > e.stacktrace.split("\n").length)
  ) {
    return parseOpera9(e)
  }

  if (!e.stack) {
    return parseOpera10(e)
  }

  return parseOpera11(e)
}

function parseOpera9(e) {
  const lineRE = /line (\d+).*script (?:in )?(\S+)/i
  const lines = e.message.split("\n")
  const result = []

  for (let i = 2, len = lines.length; i < len; i += 2) {
    const match = lineRE.exec(lines[i])
    if (match) {
      result.push(
        stackframe({
          filename: match[2],
          line: match[1],
          source: lines[i],
        })
      )
    }
  }

  return result
}

function parseOpera10(err) {
  const lineRE = /line (\d+).*script (?:in )?(\S+)(?:: in function (\S+))?$/i
  const lines = err.stacktrace.split("\n")
  const result = []

  for (let i = 0, len = lines.length; i < len; i += 2) {
    const match = lineRE.exec(lines[i])
    if (match) {
      result.push(
        stackframe({
          function: match[3] || undefined,
          filename: match[2],
          line: match[1],
          source: lines[i],
        })
      )
    }
  }

  return result
}

// Opera 10.65+ Error.stack very similar to FF/Safari
function parseOpera11(error) {
  const filtered = error.stack
    .split("\n")
    .filter(
      (line) =>
        Boolean(line.match(FIREFOX_SAFARI_STACK_REGEX)) &&
        !line.match(/^Error created at/)
    )

  return filtered.map((line) => {
    const tokens = line.split("@")
    const locationParts = extractLocation(tokens.pop())
    const functionCall = tokens.shift() || ""
    const functionName =
      functionCall
        .replace(/<anonymous function(: (\w+))?>/, "$2")
        .replace(/\([^)]*\)/g, "") || undefined
    let argsRaw
    if (functionCall.match(/\(([^)]*)\)/)) {
      argsRaw = functionCall.replace(/^[^(]+\(([^)]*)\)$/, "$1")
    }

    const args =
      argsRaw === undefined || argsRaw === "[arguments not available]"
        ? undefined
        : argsRaw.split(",")

    return stackframe({
      function: functionName,
      args,
      filename: locationParts[0],
      line: locationParts[1],
      column: locationParts[2],
      source: line,
    })
  })
}

export default function parseErrorStack(err) {
  if (
    typeof err.stacktrace !== "undefined" ||
    typeof err["opera#sourceloc"] !== "undefined"
  ) {
    return parseOpera(err)
  }

  if (err.stack && err.stack.match(CHROME_IE_STACK_REGEX)) {
    return parseV8OrIE(err)
  }

  if (err.stack) return parseFFOrSafari(err)

  console.warn(`Cannot parse given Error object: ${err}`)
  return []
}
