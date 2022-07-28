import { normalizeListen, eventsMap } from "../../fabric/dom/listen.js"
import { normalizeTokens } from "../normalize.js"
import hash from "../../fabric/type/any/hash.js"
import expr from "../../core/expr.js"
import allocate from "../../fabric/locator/allocate.js"

const makeEventLocals = (loc, e, target) => {
  const eventLocals = Object.defineProperties(
    { target, e, event: e },
    { rect: { get: () => target.getBoundingClientRect() } }
  )
  return allocate({}, loc, eventLocals, "/")
}

function compileRun(val, ctx) {
  const parsed = expr.parse(val)

  const { actions } = normalizeTokens(parsed, ctx)

  const fn = expr.compile(parsed, {
    assignment: true,
    async: true,
    sep: "/",
    actions,
  })

  const scope = ctx.globalScope ?? ctx.scope

  return (e, target) =>
    fn(ctx.reactive.state, makeEventLocals(scope, e, target))
}

function forkCtx(ctx, key) {
  return { ...ctx, steps: `${ctx.steps},${ctx.el.localName}^${key}` }
}

// @read https://labs.levelaccess.com/index.php/ARIA_Haspopup_property
const POPUP_TYPES = new Set(["menu", "listbox", "tree", "grid", "dialog"])

function setOpener(el, ctx, key, def, type) {
  ctx = forkCtx(ctx, key)
  el.id ||= hash(String(ctx.steps))
  def.opener = `#${el.id}`
  type ??= def.tag?.startsWith("ui-") ? def.tag.slice(3) : def.role ?? def.tag
  const haspopup = POPUP_TYPES.has(type) ? type : "true"
  el.setAttribute("aria-haspopup", haspopup)
  return ctx
}

function setDialogTrigger(el, ctx, key, def) {
  ctx = setOpener(el, ctx, key, def, "dialog")
  return async () => {
    const dialog = await import("../components/dialog.js") //
      .then((m) => m.default)
    await dialog(def, ctx)
  }
}

function setPopupTrigger(el, ctx, key, def) {
  ctx = setOpener(el, ctx, key, def)
  el.setAttribute("aria-expanded", "false")
  return async () => {
    el.setAttribute("aria-expanded", "true")
  }
}

export default function renderListen(el, defs, ctx) {
  const { list } = normalizeListen([{ signal: ctx.signal }, el, ...defs], {
    returnForget: false,
    getEvents(events) {
      for (const [key, val] of Object.entries(events)) {
        if (typeof val === "string") {
          events[key] = compileRun(val, forkCtx(ctx, key))
        } else if ("dialog" in val) {
          events[key] = setDialogTrigger(el, ctx, key, val.dialog)
        } else if ("popup" in val) {
          events[key] = setPopupTrigger(el, ctx, key, val.popup)
        } else {
          events[key] = val.bind(ctx)
        }
      }

      return events
    },
  })

  for (const item of list) eventsMap(item)
}
