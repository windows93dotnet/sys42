import { normalizeListen, eventsMap } from "../../fabric/dom/listen.js"
import { normalizeTokens } from "../normalize.js"
import hash from "../../fabric/type/any/hash.js"
import expr from "../../core/expr.js"

const makeEventLocals = (e, target) =>
  Object.defineProperties(
    { target, e, event: e },
    { rect: { get: () => target.getBoundingClientRect() } }
  )

function compileRun(val, newCtx) {
  const parsed = expr.parse(val)

  const { filters } = normalizeTokens(parsed, newCtx)

  const fn = expr.compile(parsed, {
    assignment: true,
    async: true,
    sep: "/",
    filters,
  })

  return (e, target) => fn(newCtx.reactive.state, makeEventLocals(e, target))
}

function forkCtx(ctx, key) {
  return { ...ctx, steps: `${ctx.steps},${ctx.el.localName}^${key}` }
}

export default function renderListen(el, defs, ctx) {
  const { list } = normalizeListen([{ signal: ctx.signal }, el, ...defs], {
    returnForget: false,
    getEvents(events) {
      for (const [key, val] of Object.entries(events)) {
        if (typeof val === "string") {
          events[key] = compileRun(val, forkCtx(ctx, key))
        } else if ("dialog" in val) {
          const newCtx = forkCtx(ctx, key)
          el.id ||= hash(String(newCtx.tracks))
          val.dialog.opener = `#${el.id}`
          events[key] = async () => {
            const dialog = await import("../components/dialog.js") //
              .then((m) => m.default)
            await dialog(val.dialog, newCtx)
          }
        } else if ("popup" in val) {
          console.log("popup")
        }
      }

      return events
    },
  })

  for (const item of list) eventsMap(item)
}
