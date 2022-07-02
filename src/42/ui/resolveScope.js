import resolvePath from "../fabric/type/path/core/resolvePath.js"
import parseDotNotation from "../fabric/locator/parseDotNotation.js"
import basename from "../fabric/type/path/extract/basename.js"
import locate from "../fabric/locator/locate.js"
import exists from "../fabric/locator/exists.js"

const sep = "/"

function getLocPrefix(source) {
  let buffer = ""
  let current = 0

  let lastCharEscaped = false

  while (current < source.length) {
    const char = source[current]

    if (char === "\\") {
      lastCharEscaped = true
      buffer += char
      current++
      continue
    }

    if (lastCharEscaped) {
      lastCharEscaped = false
      buffer += char
      current++
      continue
    }

    if (char === "/" || char === ".") {
      return buffer
    }

    buffer += char
    current++
  }

  return buffer
}

function checkProps(ctx, path) {
  if (path !== ".") path = getLocPrefix(path)
  const prop = locate(ctx.props, path, sep)
  if (prop && prop.state !== true) return ctx.scope
  if (ctx.computed && exists(ctx.computed, path, sep)) return ctx.scope
}

export default function resolveScope(scope, loc, ctx) {
  if (loc == null) throw new Error("Undefined path")
  loc = String(loc)

  if (typeof scope === "string") {
    if (ctx?.props) scope = checkProps(ctx, loc) ?? scope
  } else {
    ctx ??= scope
    scope = ctx.scope

    if (ctx.globalScope) {
      if (loc.startsWith("./") || loc.startsWith("../")) {
        scope = ctx.globalScope
      } else {
        scope = ctx.props
          ? checkProps(ctx, loc) ?? ctx.globalScope
          : ctx.globalScope
      }
    }
  }

  if (loc.startsWith("@") || loc.startsWith("#")) {
    loc = `../${loc}:${basename(scope)}`
  }

  const out = parseDotNotation(resolvePath(scope, loc)).join("/")
  if (ctx === undefined) return out
  return locate(ctx.state.value, `${out}/$ref`, sep) ?? out
}
