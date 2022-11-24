/* eslint-disable no-unused-expressions */
import Component from "../classes/Component.js"
import rpc from "../../core/ipc/rpc.js"
import omit from "../../fabric/type/object/omit.js"
import dispatch from "../../fabric/event/dispatch.js"
import maxZIndex from "../../fabric/dom/maxZIndex.js"
import { objectifyDef, forkDef, normalizePlugins } from "../normalize.js"
import forceOpener from "../forceOpener.js"
import uid from "../../core/uid.js"
import { autofocus } from "../../fabric/dom/focus.js"
import nextCycle from "../../fabric/type/promise/nextCycle.js"
import queueTask from "../../fabric/type/function/queueTask.js"
import postrenderAutofocus from "../postrenderAutofocus.js"

const _axis = Symbol("axis")

const zIndexSector = ":root > :is(ui-dialog, ui-menu)"

export class Dialog extends Component {
  static definition = {
    tag: "ui-dialog",

    id: true,
    role: "dialog",

    traits: {
      emittable: true,
      movable: { handler: ".ui-dialog__title", maxZIndex: zIndexSector },
    },

    props: {
      opener: {
        type: "string",
      },
      active: {
        type: "boolean",
        reflect: true,
        default: true,
      },
      x: {
        type: "number",
        update: _axis,
      },
      y: {
        type: "number",
        update: _axis,
      },
    },

    defaults: {
      label: undefined,
      footer: undefined,
    },

    on: [
      { "pointerdown || focusin": "{{activate()}}" },
      globalThis,
      {
        "blur || uiiframeblur"() {
          queueTask(() => {
            if (this.el?.contains(document.activeElement)) this.el.activate()
          })
        },
      },
    ],
  };

  [_axis]() {
    this.style.transform = `translate(${this.x}px, ${this.y}px)`
  }

  async close(ok = false) {
    const event = dispatch(this, "uidialogbeforeclose", { cancelable: true })
    if (event.defaultPrevented) return
    const data = omit(this.ctx.reactive.data, ["$ui", "$computed"])
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

  render({ content, label, footer }) {
    const buttons = [
      {
        tag: "button.ui-dialog__close",
        picto: "close",
        aria: { label: "Close" },
        on: { click: "{{close()}}" },
      },
    ]

    const id = uid()
    this.setAttribute("aria-labelledby", id)

    const def = [
      {
        tag: "header.ui-dialog__header",
        content: [
          { tag: "h2.ui-dialog__title", id, content: label },
          ...buttons,
        ],
      },
      {
        tag: "section.ui-dialog__body",
        content,
      },
    ]

    if (footer) {
      def.push({
        tag: "footer.ui-dialog__footer",
        content: footer,
      })
    }

    return def
  }

  activate() {
    for (const item of document.querySelectorAll("ui-dialog")) {
      item.active = false
    }

    this.active = true
    this.style.zIndex = maxZIndex(zIndexSector) + 1

    if (!this.contains(document.activeElement)) {
      postrenderAutofocus(this) ||
        autofocus(this.querySelector(":scope > .ui-dialog__body")) ||
        autofocus(this.querySelector(":scope > .ui-dialog__footer"))
    }
  }

  setup() {
    const rect = this.getBoundingClientRect()
    this.x ??= Math.round(rect.x)
    this.y ??= Math.round(rect.y)
    this.style.top = 0
    this.style.left = 0
    this.activate()

    this.emit("open", this)
    dispatch(this, "uidialogopen")
  }
}

Component.define(Dialog)

const tracker = new Map()

export const dialog = rpc(
  async function dialog(def, ctx) {
    const { steps } = ctx
    let n = tracker.has(steps) ? tracker.get(steps) : 0
    ctx = { ...ctx }
    ctx.steps += ",dialog°" + n++
    tracker.set(steps, n)

    const el = new Dialog(def, ctx)
    const { opener } = el
    await el.ready

    document.documentElement.append(el)

    return el.once("close").then((res) => ({ res, opener }))
  },
  {
    module: import.meta.url,

    async marshalling(def = {}, ctx) {
      def = objectifyDef(def)

      forceOpener(def)

      if (rpc.inTop) {
        ctx = { ...ctx, detached: true }
        return [def, ctx]
      }

      if (ctx?.plugins) await normalizePlugins(ctx, ["ipc"], { now: true })

      return [forkDef(def, ctx), {}]
    },

    unmarshalling({ res, opener }) {
      document.querySelector(`#${opener}`)?.focus()
      return res
    },
  }
)

export default dialog
