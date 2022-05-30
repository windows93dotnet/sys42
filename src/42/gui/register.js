export default function register(ctx, get, render) {
  const renderer = async () => {
    const res = get(ctx.state.proxy)
    if (res !== undefined) ctx.undones.push(res)
    render(await res)
  }

  for (const scope of get.keys) {
    ctx.renderers[scope] ??= new Set()
    ctx.renderers[scope].add(renderer)
    ctx.cancel.signal.addEventListener(
      "abort",
      () => {
        ctx.global.renderers[scope].delete(renderer)
        if (ctx.global.renderers[scope].size === 0) {
          delete ctx.global.renderers[scope]
        }
      },
      { once: true }
    )
  }

  renderer()
}
