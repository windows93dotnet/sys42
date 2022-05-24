import State from "./class/State.js"
import template from "../system/formats/template.js"
import Canceller from "../fabric/class/Canceller.js"
import resolvePath from "../fabric/type/path/core/resolvePath.js"
import isLength from "../fabric/type/any/is/isLength.js"

function resolve(scope, path) {
  return resolvePath(scope, path).replaceAll(".", "/")
}

function normaliseString(def, ctx) {
  const parsed = template.parse(def)

  if (parsed.substitutions.length > 0) {
    const keys = []
    for (const tokens of parsed.substitutions) {
      for (const token of tokens) {
        if (token.type === "key") {
          token.value = resolve(ctx.scope, token.value)
          keys.push(token.value)
        } else if (
          token.type === "arg" &&
          isLength(token.value) &&
          Array.isArray(ctx.state.get(ctx.scope))
        ) {
          token.type = "key"
          token.value = resolve(ctx.scope, token.value)
          keys.push(token.value)
        }
      }
    }

    def = template.compile(parsed, { sep: "/" })
    def.keys = keys
    return def
  }
}

export default function normalize(def, ctx) {
  ctx.scope ??= "/"
  ctx.renderers ??= {}
  ctx.cancel ??= new Canceller()
  ctx.state ??= new State(ctx)
  ctx = { ...ctx }

  let type = typeof def

  if (type === "string") {
    const fn = normaliseString(def, ctx)
    if (fn) {
      def = fn
      type = "function"
    }
  } else {
    if (def.data) ctx.state.assign(ctx.scope, def.data)
    if (def.scope) ctx.scope = resolvePath(ctx.scope, def.scope)
  }

  return {
    type,
    def,
    ctx,
  }
}
