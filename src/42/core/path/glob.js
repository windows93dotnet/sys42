// @thanks https://github.com/sindresorhus/multimatch

// *  matches any number of characters, but not /
// ?  matches a single character, but not /
// ** matches any number of characters, including /, as long as it's the only thing in a path part
// {} allows for a comma-separated list of "or" expressions
// !  at the beginning of a pattern will negate the match

import arrify from "../../fabric/type/any/arrify.js"
import uniq from "../../fabric/type/array/uniq.js"
import union from "../../fabric/type/array/union.js"
import difference from "../../fabric/type/array/difference.js"
import escapeRegex from "../../fabric/type/string/escapeRegex.js"
import locate from "../../fabric/locator/locate.js"
import exists from "../../fabric/locator/exists.js"

const DEFAULTS = {
  onlyFiles: false,
}

export const parseGlob = (source) => {
  let current = 0

  const tokens = []
  let type = "root"
  let buffer = ""

  const flush = () => {
    if (buffer) {
      tokens.push({ type: "text", value: buffer, regex: escapeRegex(buffer) })
      buffer = ""
    }
  }

  while (current < source.length) {
    const char = source[current]

    if (char === "\\") {
      flush()
      const value = `\\` + source[++current]
      tokens.push({ type: "escaped", value, regex: value })
      current++
      continue
    }

    if (type === "braces") {
      if (char === "}") {
        tokens.push({
          type: "text",
          value: buffer,
          regex: `(?:${escapeRegex(buffer).split(",").join("|")})`,
        })
        buffer = ""
        type = "root"
        tokens.push({ type: "brace", value: "}", regex: "" })
        current++
        continue
      }

      buffer += char
    }

    if (type === "root") {
      if (char === "{") {
        flush()
        type = "braces"
        tokens.push({ type: "brace", value: "{", regex: "" })
        current++
        continue
      }

      if (char === "/") {
        flush()
        tokens.push({ type: "sep", value: "/", regex: "/" })
        current++
        continue
      }

      if (char === "*") {
        const nextChar = source[current + 2]
        if (
          source[current + 1] === "*" &&
          (nextChar === "/" || nextChar === undefined)
        ) {
          // TODO: test "(?:[^/]*?(?:/|$))*?"
          tokens.push({ type: "all", value: "**", regex: ".*?" })
          current += 2
          continue
        } else {
          flush()
          tokens.push({ type: "multi", value: "*", regex: `[^/]*?` })
          current++
          continue
        }
      }

      if (char === "?") {
        flush()
        tokens.push({ type: "single", value: "?", regex: `[^/]` })
        current++
        continue
      }

      buffer += char
    }

    current++
  }

  if (
    tokens.length > 1 &&
    tokens[tokens.length - 1].type === "sep" &&
    tokens[tokens.length - 2].type === "all"
  ) {
    tokens[tokens.length - 1].regex = "/?"
  } else if (
    tokens.length > 2 &&
    tokens[tokens.length - 1].type === "multi" &&
    tokens[tokens.length - 2].type === "sep" &&
    tokens[tokens.length - 3].type === "all"
  ) {
    tokens[tokens.length - 2].regex = "/?"
  }

  flush()

  return tokens
}

export class Glob extends RegExp {
  constructor(pattern, options) {
    super(...tokensToRegexArguments(parseGlob(pattern), options))
    this.pattern = pattern
  }
}

function tokensToRegexArguments(tokens, options = {}) {
  if (typeof options === "string") options = { flags: options }
  const config = { ...DEFAULTS, ...options }
  const { flags } = config
  let body = ""
  for (let i = 0, l = tokens.length; i < l; i++) body += tokens[i].regex

  if (!config.onlyFiles) body += "/?"

  return [flags && flags.includes("g") ? body : `^${body}$`, flags]
}

export default function glob(paths, patterns) {
  paths = arrify(paths)
  patterns = arrify(patterns)

  if (paths.length === 0 || patterns.length === 0) return []

  let out = []

  for (const pattern of patterns) {
    const [exclude, reg] = pattern.startsWith("!")
      ? [true, new Glob(pattern.slice(1))]
      : [false, new Glob(pattern)]
    out = (exclude ? difference : union)(
      out,
      paths.filter((x) => reg.test(x))
    )
  }

  return uniq(out)
}

glob.test = (paths, patterns) => glob(paths, patterns).length > 0

const flattenKeys = (obj, prefix = "") => {
  const out = []

  if (!obj) return out

  for (const [key, val] of Object.entries(obj)) {
    const pre = prefix + "/"
    if (val && typeof val === "object") {
      out.push(pre + key + "/", ...flattenKeys(val, pre + key))
    } else out.push(pre + key)
  }

  return out
}

glob.locate = (obj, patterns, options) => {
  patterns = arrify(patterns)

  if (patterns.length === 0) return []

  let out = []

  let flattened = {}

  for (const pattern of patterns) {
    if (!pattern) continue

    const [exclude, tokens] = pattern.startsWith("!")
      ? [true, parseGlob(pattern.slice(1))]
      : [false, parseGlob(pattern)]

    const reg = new RegExp(...tokensToRegexArguments(tokens, options))
    let paths = []
    let current = ""
    let buffer = ""

    for (const { type, value } of tokens) {
      if (type === "all" || type === "multi") {
        const sub = locate(obj, current, "/")
        paths = flattened[current] ?? flattenKeys(sub, current)
        flattened[current] ??= paths
        break
      } else if (type === "sep") {
        current = buffer
        buffer += value
      } else {
        buffer += value
      }
    }

    out = (exclude ? difference : union)(
      out,
      paths.filter((x) => reg.test(x))
    )

    if (exists(obj, pattern, "/")) {
      out.push(pattern.startsWith("/") ? pattern : "/" + pattern)
    }
  }

  flattened = undefined

  return uniq(out)
}
