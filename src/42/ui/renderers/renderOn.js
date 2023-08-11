/* eslint-disable max-params */
import { normalizeListen, eventsMap } from "../../fabric/event/on.js"
import { normalizeTokens } from "../normalize.js"
import hash from "../../fabric/type/any/hash.js"
import expr from "../../core/expr.js"
import uid from "../../core/uid.js"
import allocate from "../../fabric/locator/allocate.js"
import inIframe from "../../core/env/realm/inIframe.js"

const makeEventLocals = (loc, e, target) => {
  const eventLocals = Object.defineProperties(
    { target, e, event: e },
    { rect: { get: () => target.getBoundingClientRect() } },
  )
  return allocate({}, loc, eventLocals, "/")
}

function compileRun(val, stage) {
  const tokens = expr.parse(val)

  const { actions, locals } = normalizeTokens(tokens, stage, {
    specials: ["e", "event", "target", "rect"],
  })

  const fn = expr.compile(tokens, {
    assignment: true,
    async: true,
    delimiter: "/",
    actions,
    locals,
  })

  return (e, target) => {
    const eventLocals = makeEventLocals(stage.scope, e, target)
    fn(stage.reactive.state, eventLocals)
  }
}

function forkStage(stage, key) {
  return { ...stage, steps: `${stage.steps},${stage.el.localName}^${key}` }
}

// @read https://labs.levelaccess.com/index.php/ARIA_Haspopup_property
const POPUP_TYPES = new Set(["menu", "listbox", "tree", "grid", "dialog"])

function setOpener(el, stage, key, plan, type) {
  stage = forkStage(stage, key)

  el.id ||= hash(String(stage.steps))
  if (inIframe) window.name ||= uid()
  plan.openerFrame = window.name

  type ??= plan.tag?.startsWith("ui-")
    ? plan.tag.slice(3)
    : plan.role ?? plan.tag
  el.setAttribute("aria-haspopup", POPUP_TYPES.has(type) ? type : "true")
  if (type !== "dialog") el.setAttribute("aria-expanded", "false")
  return stage
}

function setDialogOpener(el, stage, key, defaultPlan) {
  stage = setOpener(el, stage, key, defaultPlan, "dialog")

  return function openDialog(e) {
    const plan = { ...defaultPlan, opener: el.id }
    if (e.detail && typeof e.detail === "object") Object.assign(plan, e.detail)

    const deferred = import("../components/dialog.js") //
      .then(({ dialog }) => dialog(plan, stage))

    plan.handler?.(e, { deferred, el, plan, stage })
  }
}

function setPopupOpener(el, stage, key, defaultPlan) {
  stage = setOpener(el, stage, key, defaultPlan)
  const { focusBack } = defaultPlan

  return function openPopup(e) {
    const plan = { ...defaultPlan, opener: el.id }
    if (e.detail && typeof e.detail === "object") Object.assign(plan, e.detail)

    if (e.type === "contextmenu" && e.x > 0 && e.y > 0) {
      plan.rect = { x: e.x, y: e.y }
    }

    if (focusBack === true) {
      const { activeElement } = document
      activeElement.id ||= uid()
      plan.focusBack = activeElement.id
    }

    const deferred = import("../popup.js") //
      .then(({ popup }) => popup(el, plan, stage))

    plan.handler?.(e, { deferred, el, plan, stage })
  }
}

export default function renderOn(el, plan, stage) {
  const { list } = normalizeListen([{ signal: stage.signal }, el, ...plan.on], {
    returnForget: false,
    getEvents(events) {
      for (const [key, val] of Object.entries(events)) {
        if (typeof val === "string") {
          events[key] = compileRun(val, forkStage(stage, key))
        } else if ("dialog" in val) {
          events[key] = setDialogOpener(el, stage, key, val.dialog)
        } else if ("popup" in val) {
          events[key] = setPopupOpener(el, stage, key, val.popup)
        } else {
          events[key] = val.bind(stage)
        }
      }

      return events
    },
  })

  eventsMap(list)

  stage.waitlistPostrender.push(() => {
    el.dispatchEvent(new CustomEvent("render"))
  })
}
