const options = { once: true }

export default function register(ctx, get, render) {
  const renderer = async () => {
    const res = get(ctx.state.proxy)
    if (res !== undefined) ctx.undones.push(res)
    render(await res)
  }

  for (const scope of get.keys) {
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
