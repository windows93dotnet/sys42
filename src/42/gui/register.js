export default function register(keys, ctx, render) {
  for (const scope of keys) {
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
