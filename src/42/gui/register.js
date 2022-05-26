import isPromiseLike from "../fabric/type/any/is/isPromiseLike.js"

export default function register(ctx, get, render) {
  const exec = () => {
    const res = get(ctx.state.proxy)
    if (isPromiseLike(res)) ctx.undones.push(res.then(render))
    else render(res)
  }

  for (const scope of get.keys) {
    ctx.renderers[scope] ??= new Set()
    ctx.renderers[scope].add(exec)
    ctx.cancel.signal.addEventListener(
      "abort",
      () => {
        ctx.global.renderers[scope].delete(exec)
        if (ctx.global.renderers[scope].size === 0) {
          delete ctx.global.renderers[scope]
        }
      },
      { once: true }
    )
  }

  exec()
}
