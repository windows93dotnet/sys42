/* eslint-disable no-unused-expressions */
import Component from "../../../42/ui/classes/Component.js"
import {
  objectifyPlan,
  forkPlan,
  normalizePlugins,
} from "../../../42/ui/normalize.js"
import forceOpener from "../../../42/ui/utils/forceOpener.js"
import postrenderAutofocus from "../../../42/ui/utils/postrenderAutofocus.js"
import rpc from "../../../42/core/ipc/rpc.js"

import omit from "../../../42/fabric/type/object/omit.js"
import nextCycle from "../../../42/fabric/type/promise/nextCycle.js"
import queueTask from "../../../42/fabric/type/function/queueTask.js"
import emittable from "../../../42/fabric/traits/emittable.js"
import dispatch from "../../../42/fabric/event/dispatch.js"
import maxZIndex from "../../../42/fabric/dom/maxZIndex.js"
import { autofocus } from "../../../42/fabric/dom/focus.js"

const _axis = Symbol("axis")

const rootSelector = ":is(:root, ui-workspace[active])"

const zIndexSelector = `${rootSelector} > :is(ui-dialog, ui-menu)`

function getHeaderOffset(el) {
  const styles = getComputedStyle(el)
  const paddingTop = Number.parseInt(styles.paddingTop, 10)
  const borderTopWidth = Number.parseInt(styles.borderTopWidth, 10)
  return paddingTop + borderTopWidth
}

function activateIfFocused() {
  queueTask(() => {
    if (this.el?.contains(document.activeElement)) this.el.activate()
  })
}

export class Dialog extends Component {
  static plan = {
    tag: "ui-dialog",
    role: "dialog",
    id: true,

    traits: {
      // emittable: true,
      movable: {
        handlerSelector: ".ui-dialog__title",
        zIndexSelector,
      },
    },

    props: {
      opener: {
        type: "string",
      },
      active: {
        type: "boolean",
        reflect: true,
      },
      x: {
        type: "number",
        update: _axis,
      },
      y: {
        type: "number",
        update: _axis,
      },
      // label: {
      //   type: "any",
      // },
      content: {
        type: "any",
      },
    },

    defaults: {
      label: undefined,
      footer: undefined,
    },

    on: [
      { pointerdown: "{{activate()}}" },
      { focusin: activateIfFocused },
      globalThis,
      { "blur || uiiframeblur": activateIfFocused },
    ],
  }

  constructor(...args) {
    super(...args)
    emittable(this)
  }

  [_axis]() {
    this.style.translate = `${this.x}px ${this.y}px`
  }

  async close(ok = false) {
    if (!this.stage) return
    const event = dispatch(this, "uidialogbeforeclose", { cancelable: true })
    if (event.defaultPrevented) return
    const data = omit(this.stage.reactive.data, ["$ui", "$computed"])
    if (ok) data.ok = true
    this.emit("close", data)
    await this.destroy()
    dispatch(globalThis, "uidialogclose")
    return data
  }

  async ok() {
    await nextCycle()
    return this.close(true)
  }

  activate() {
    for (const item of document.querySelectorAll(
      `${rootSelector} > ui-dialog:not(#${this.id})`,
    )) {
      item.active = false
    }

    if (this.active) return

    this.active = true
    this.style.zIndex = maxZIndex(zIndexSelector) + 1

    if (!this.contains(document.activeElement)) {
      postrenderAutofocus(this) ||
        autofocus(this.querySelector(":scope > .ui-dialog__body")) ||
        autofocus(this.querySelector(":scope > .ui-dialog__footer"))
    }
  }

  render({ content, label, picto, footer, plugins }) {
    const buttons = [
      {
        tag: "button.ui-dialog__close",
        picto: "close",
        aria: { label: "Close" },
        on: { click: "{{close()}}" },
      },
    ]

    const id = this.id + "-title"
    this.setAttribute("aria-labelledby", id)

    label = { tag: "span.ui-dialog__title__text", content: label }

    const plan = [
      {
        tag: "header.ui-dialog__header",
        content: [
          {
            tag: "h2.ui-dialog__title",
            id,
            content: picto ? [{ tag: "ui-picto", value: picto }, label] : label,
          },
          ...buttons,
        ],
      },
      {
        tag: "section.ui-dialog__body",
        content,
      },
    ]

    if (footer) {
      plan.push({
        tag: "footer.ui-dialog__footer",
        content: footer,
      })
    }

    plan.plugins = plugins

    return plan
  }

  setup() {
    if (this.x === undefined) {
      let { x, y } = this.getBoundingClientRect()

      x = Math.round(x)
      y = Math.round(y)

      let offset
      for (const item of document.querySelectorAll(
        `${rootSelector} > ui-dialog:not(#${this.id})`,
      )) {
        if (item.x !== undefined) {
          if (x === item.x && y === item.y) {
            offset ??=
              this.querySelector(":scope > .ui-dialog__header").clientHeight +
              getHeaderOffset(this)
            x += offset
            y += offset
          }
        }
      }

      this.x = x
      this.y = y
      this.style.top = 0
      this.style.left = 0
    }

    this.activate()

    this.emit("open", this)
    dispatch(this, "uidialogopen")
  }
}

Component.define(Dialog)

const tracker = new Map()

export const dialog = rpc(
  async function dialog(plan, stage) {
    const { steps } = stage
    const n = tracker.has(steps) ? tracker.get(steps) + 1 : 0
    tracker.set(steps, n)

    stage = { ...stage }
    stage.steps += ",dialog°" + n

    const el = new Dialog(plan, stage)
    const { opener } = el

    await el.ready
    document.documentElement.append(el)

    return el.once("close").then((res) => ({ res, opener }))
  },
  {
    module: import.meta.url,

    async marshalling(plan = {}, stage) {
      plan = objectifyPlan(plan)

      plan.content ??= ""
      forceOpener(plan)

      if (rpc.inTop) {
        stage = { ...stage, detached: true }
        return [plan, stage]
      }

      if (stage?.plugins) await normalizePlugins(stage, ["ipc"], { now: true })

      return [forkPlan(plan, stage), { trusted: true } /* ATTACK */]
    },

    unmarshalling({ res, opener }) {
      document.querySelector(`#${opener}`)?.focus()
      return res
    },
  },
)

export default dialog
