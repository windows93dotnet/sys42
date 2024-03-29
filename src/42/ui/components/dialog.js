/* eslint-disable no-unused-expressions */
import Component from "../classes/Component.js"
import { objectifyPlan, forkPlan, normalizePlugins } from "../normalize.js"
import ensureOpener from "../utils/ensureOpener.js"
import postrenderAutofocus from "../utils/postrenderAutofocus.js"
import rpc from "../../core/ipc/rpc.js"

import omit from "../../fabric/type/object/omit.js"
import untilNextTask from "../../fabric/type/promise/untilNextTask.js"
import queueTask from "../../fabric/type/function/queueTask.js"
import emittable from "../../fabric/traits/emittable.js"
import dispatch from "../../fabric/event/dispatch.js"
import maxZIndex from "../../fabric/dom/maxZIndex.js"
import { autofocus } from "../../fabric/dom/focus.js"

const { isFinite } = Number

const _axis = Symbol("Dialog.axis")
const _width = Symbol("Dialog.width")
const _height = Symbol("Dialog.height")

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
      width: {
        type: "number",
        update: _width,
      },
      height: {
        type: "number",
        update: _height,
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
      { "blur || ui:iframe.blur": activateIfFocused },
    ],
  }

  constructor(...args) {
    super(...args)
    emittable(this)
  }

  [_axis]() {
    const x = isFinite(this.x) ? `${this.x}px` : this.x
    const y = isFinite(this.y) ? `${this.y}px` : this.y
    this.style.translate = `${x} ${y}`
  }

  [_width]() {
    this.style.width = isFinite(this.width) ? `${this.width}px` : this.width
  }

  [_height]() {
    this.style.height = isFinite(this.height) ? `${this.height}px` : this.height
  }

  async close(ok = false) {
    const event = dispatch(this, "ui:dialog.before-close", { cancelable: true })
    if (event.defaultPrevented) return

    const data = this.stage
      ? omit(this.stage.reactive.data, ["$ui", "$computed"])
      : {}

    this.emit("close", {
      ok,
      data,
      opener: this.opener,
    })

    await this.destroy({ remove: false })
    dispatch(this, "ui:dialog.close")
    await this.remove()
    return data
  }

  async ok() {
    await untilNextTask() // TODO: check if needed
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
    this[_width]()
    this[_height]()

    if (this.x === undefined || this.y === undefined) {
      const positionAuto = this.x === undefined && this.y === undefined
      const { x, y } = this.getBoundingClientRect()
      this.x ??= Math.round(x)
      this.y ??= Math.round(y)
      if (positionAuto) this.fixOverlap()
    }

    this.style.top = 0
    this.style.left = 0

    this.activate()

    this.emit("open", this)
    dispatch(this, "ui:dialog.open")
  }

  fixOverlap() {
    let offset
    let { x, y } = this
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

    if (this.x !== x) this.x = x
    if (this.y !== y) this.y = y
  }
}

Component.define(Dialog)

const tracker = new Map()

function focusBack(opener) {
  document.querySelector(`#${opener}`)?.focus()
  dispatch(window, "ui:dialog.after-close", { detail: { opener } })
}

export const dialog = rpc(
  function dialog(plan, stage) {
    const { steps } = stage
    const n = tracker.has(steps) ? tracker.get(steps) + 1 : 0
    tracker.set(steps, n)

    stage.steps += ",dialog°" + n

    const el = new Dialog(plan, stage)
    el.ready.then(() => document.documentElement.append(el))

    return plan.returnsData ? el.once("close") : el
  },
  {
    module: import.meta.url,

    async marshalling(plan = {}, stage) {
      plan = objectifyPlan(plan)

      plan.content ??= ""
      ensureOpener(plan)

      if (rpc.inTop) {
        stage = { ...stage, cancel: undefined }
        return [plan, stage]
      }

      if (stage?.plugins) await normalizePlugins(stage, ["ipc"], { now: true })

      return [forkPlan(plan, stage), {}]
    },

    unmarshalling(controller, [plan, stage]) {
      if (plan?.returnsData) {
        focusBack(controller.opener)
        return controller
      }

      // Close dialog when parent ui is destroyed
      const off = stage?.reactive?.on("destroy", { off: true }, () => {
        controller.close()
      })

      controller.once("close").then(async ({ opener }) => {
        off?.()
        focusBack(opener)
      })

      return controller
    },
  },
)

export default dialog
