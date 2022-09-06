/* eslint-disable max-params */
import { normalizeListen, eventsMap } from "../../fabric/event/on.js"
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

  const fn = expr.compile(parsed, {
    assignment: true,
    async: true,
    sep: "/",
    actions: normalizeTokens(parsed, ctx).actions,
  })

  return (e, target) => {
    const eventLocals = makeEventLocals(ctx.scope, e, target)
    ctx.undones.push(fn(ctx.reactive.state, eventLocals))
  }
}

function forkCtx(ctx, key) {
  return { ...ctx, steps: `${ctx.steps},${ctx.el.localName}^${key}` }
}

// @read https://labs.levelaccess.com/index.php/ARIA_Haspopup_property
const POPUP_TYPES = new Set(["menu", "listbox", "tree", "grid", "dialog"])

function setOpener(el, ctx, key, def, type) {
  ctx = forkCtx(ctx, key)
  el.id ||= hash(String(ctx.steps))
  def.opener = el.id
  type ??= def.tag?.startsWith("ui-") ? def.tag.slice(3) : def.role ?? def.tag
  el.setAttribute("aria-haspopup", POPUP_TYPES.has(type) ? type : "true")
  if (type !== "dialog") el.setAttribute("aria-expanded", "false")
  return ctx
}

function setDialogTrigger(el, ctx, key, def) {
  ctx = setOpener(el, ctx, key, def, "dialog")
  return async () => {
    await import("../components/dialog.js") //
      .then((m) => m.default(def, ctx))
  }
}

function setPopupTrigger(el, ctx, key, def) {
  ctx = setOpener(el, ctx, key, def)
  return async () => {
    await import("../popup.js") //
      .then((m) => m.default(el, def, ctx))
  }
}

export default function renderOn(el, defs, ctx) {
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

  eventsMap(list)
}
