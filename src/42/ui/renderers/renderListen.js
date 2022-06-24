import listen from "../../fabric/dom/listen.js"
import { normalizeTokens } from "../normalize.js"
import expr from "../../system/expr.js"

export default function renderListen(el, def, ctx) {
  const events = {}

  for (const [key, val] of Object.entries(def)) {
    const parsed = expr.parse(val)
    const { filters } = normalizeTokens(parsed, ctx)
    const fn = expr.compile(parsed, {
      assignment: true,
      async: true,
      sep: "/",
      thisArg: ctx,
      filters,
    })

    events[key] = (e) => {
      const { proxy } = Proxy.revocable(ctx.state.proxy, {
        has(target, key, receiver) {
          const has = Reflect.has(target, key, receiver)
          if (
            has === false &&
            (key === "e" ||
              key === "event" ||
              key === "target" ||
              key === "rect")
          ) {
            return true
          }

          return has
        },

        get(target, key, receiver) {
          const val = Reflect.get(target, key, receiver)
          if (val === undefined) {
            if (key === "e" || key === "event") return e
            if (key === "target") return e.target
            if (key === "rect") return e.target.getBoundingClientRect()
          }

          return val
        },
      })
      fn(proxy)
    }
  }

  listen(el, events, { signal: ctx.cancel.signal })
}
