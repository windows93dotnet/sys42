import listen from "../../fabric/dom/listen.js"
import { normalizeTokens } from "../normalize.js"
import expr from "../../system/expr.js"

const makeEventLocals = (e, target) =>
  Object.defineProperties(
    { target, e, event: e },
    { rect: { get: () => target.getBoundingClientRect() } }
  )

export default function renderListen(el, def, ctx) {
  const events = []

  for (const [key, val] of Object.entries(def)) {
    const event = {}
    const type = typeof val
    if (type === "string") {
      const parsed = expr.parse(val)

      const { filters } = normalizeTokens(parsed, ctx)

      const fn = expr.compile(parsed, {
        assignment: true,
        async: true,
        sep: "/",
        filters,
      })

      event[key] = (e, target) =>
        fn(ctx.reactive.state, makeEventLocals(e, target))
    } else if (type === "object") {
      if ("dialog" in val) {
        event[key] = async () => {
          const dialog = await import("../components/dialog.js") //
            .then((m) => m.default)
          await dialog(val.dialog, ctx)
        }
      } else if ("menu" in val) {
        console.log("menu")
      }
    } else if (type === "function") {
      event[key] = val.bind(ctx)
    }

    events.push(event)
  }

  listen(el, ...events, { signal: ctx.cancel.signal })
}
