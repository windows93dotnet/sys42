import persist from "../../core/persist.js"
import debounce from "../../fabric/type/function/debounce.js"
import omit from "../../fabric/type/object/omit.js"

export default async function persistPlugin(ctx) {
  if (ctx.plugins.persist) return

  const config = {
    initial: true,
    loaded: false,
    saved: false,
  }

  ctx.plugins.persist = config

  const persistPath = `$HOME/.ui/${ctx.id}.json5`

  if (persist.has(persistPath)) {
    config.initial = false
    const res = await persist.get(persistPath)

    if (res?.$ui?.dialog) {
      const dialogs = Object.values(res.$ui.dialog)

      if (dialogs.length > 0) {
        ctx.postrender.push(async () => {
          queueMicrotask(() => {
            for (const dialogState of dialogs) {
              const el = document.querySelector(`#${dialogState.opener}`)
              if (el) el.click()
              else console.log("dialog opener not found", dialogState)
            }
          })
        })
      }
    }

    Object.assign(ctx.reactive.state, res)

    config.loaded = true
  }

  ctx.reactive.on(
    "update",
    debounce(async () => {
      config.saved = false
      config.saved = await persist.set(
        persistPath,
        omit(ctx.reactive.data, ["$computed"])
      )
    })
  )
}
