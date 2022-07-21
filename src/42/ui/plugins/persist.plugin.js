import persist from "../../core/persist.js"

export default async (ctx) => {
  if (ctx.plugins.persist) return

  const config = {
    initial: true,
    loaded: false,
    saved: false,
  }

  ctx.plugins.persist = config

  const persistPath = `$HOME/.ui/${ctx.id}`

  if (persist.has(persistPath)) {
    config.initial = false
    const res = await persist.load(persistPath)

    if (res?.ui?.dialog) {
      const openers = []
      for (const { opener } of Object.values(res.ui.dialog)) {
        openers.push(opener)
      }

      ctx.postrender.push(() => {
        for (const opener of openers) {
          document.querySelector(opener)?.click()
        }
      })
    }

    Object.assign(ctx.reactive.state, res)

    config.loaded = true
  }

  ctx.reactive.on("update", async () => {
    config.saved = false
    await persist.save(persistPath, ctx.reactive.data)
    config.saved = true
  })
}
