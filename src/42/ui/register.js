import arrify from "../fabric/type/any/arrify.js"

const options = { once: true }

export default function register(ctx, loc, render) {
  let scopes
  let renderer

  if (typeof loc === "function") {
    scopes = loc.scopes
    renderer = async (changed) => {
      const res = loc(ctx.state.proxy)
      if (res !== undefined) ctx.undones.push(res)
      render(await res, changed)
    }
  } else {
    scopes = arrify(loc)
    renderer = (changed) => render(ctx.state.get(scopes[0]), changed)
  }

  for (const scope of scopes) {
    ctx.renderers[scope] ??= new Set()
    ctx.renderers[scope].add(renderer)
    const onabort = () => {
      ctx.renderers[scope].delete(renderer)
      if (ctx.renderers[scope].size === 0) delete ctx.renderers[scope]
    }

    ctx.cancel.signal.addEventListener("abort", onabort, options)
  }

  renderer()
}
