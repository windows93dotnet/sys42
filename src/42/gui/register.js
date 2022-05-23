import isLength from "../fabric/type/any/is/isLength.js"

export function joinScope(scope, ...keys) {
  if (keys.length === 1 && keys[0] === ".") return scope

  let out = scope

  for (const key of keys) {
    out += (out && out !== "." ? "." : "") + key
  }

  return out
}

export default function register(def, ctx, render) {
  const keys = []

  for (const tokens of def.parsed.substitutions) {
    for (const token of tokens) {
      if (token.type === "key") keys.push(token.value)
      else if (token.type === "arg" && isLength(token.value)) {
        keys.push(token.value)
      }
    }
  }

  for (const key of keys) {
    const scope = joinScope(ctx.scope, key)
    ctx.renderers[scope] ??= new Set()
    ctx.renderers[scope].add(render)
    ctx.cancel.signal.addEventListener(
      "abort",
      () => {
        ctx.global.renderers[scope].delete(render)
        if (ctx.global.renderers[scope].size === 0) {
          delete ctx.global.renderers[scope]
        }
      },
      { once: true }
    )
  }

  render()
}
