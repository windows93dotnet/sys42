import listen from "../../fabric/dom/listen.js"
import { normalizeTokens } from "../normalize.js"
import expr from "../../system/expr.js"

const makeEventLocals = (e, target) =>
  Object.defineProperties(
    { target, e, event: e },
    { rect: { get: () => target.getBoundingClientRect() } }
  )

export default function renderListen(el, def, ctx) {
  const events = {}

  for (const [key, val] of Object.entries(def)) {
    const parsed = expr.parse(val)

    const { filters } = normalizeTokens(parsed, ctx)

    const fn = expr.compile(parsed, {
      assignment: true,
      async: true,
      sep: "/",
      filters,
    })

    events[key] = (e, target) => {
      fn(ctx.reactive.state, makeEventLocals(e, target))
    }
  }

  listen(el, events, { signal: ctx.cancel.signal })
}
