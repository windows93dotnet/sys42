import arrify from "../fabric/type/any/arrify.js"

export function registerRenderer(ctx, scope, renderer) {
  ctx.renderers[scope] ??= new Set()
  ctx.renderers[scope].add(renderer)
  ctx.cancel.signal.addEventListener("abort", () => {
    if (ctx.renderers[scope]) {
      ctx.renderers[scope].delete(renderer)
      if (ctx.renderers[scope].size === 0) delete ctx.renderers[scope]
    }
  })
}

export default function register(ctx, loc, fn) {
  let scopes
  let renderer // TODO: check renderer garbage collection

  if (typeof loc === "function") {
    scopes = loc.scopes
    renderer = async (changed) => {
      const val = loc(ctx.reactive.state)
      if (val !== undefined) ctx.undones.push(val)
      const res = fn(await val, changed)
      if (res !== undefined) ctx.undones.push(res)
    }
  } else {
    scopes = arrify(loc)
    renderer = async (changed) => {
      const res = fn(ctx.reactive.get(scopes[0]), changed)
      if (res !== undefined) ctx.undones.push(res)
    }
  }

  for (const scope of scopes) {
    registerRenderer(ctx, scope, renderer)
  }

  renderer()
}

register.registerRenderer = registerRenderer
