import Component from "../class/Component.js"
import rpc from "../../core/ipc/rpc.js"
import omit from "../../fabric/type/object/omit.js"
import dispatch from "../../fabric/dom/dispatch.js"
import maxZIndex from "../../fabric/dom/maxZIndex.js"
import { objectifyDef, forkDef } from "../normalize.js"
import uid from "../../core/uid.js"
import { autofocus } from "../../fabric/dom/focus.js"

const _axis = Symbol("axis")

export class Dialog extends Component {
  static definition = {
    tag: "ui-dialog",

    id: true,
    role: "dialog",
    tabIndex: -1,

    traits: {
      emittable: true,
      movable: {
        throttle: false,
        handler: ".ui-dialog__title",
      },
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

    plugins: ["ipc"],
  };

  [_axis]() {
    this.style.transform = `translate(${this.x}px, ${this.y}px)`
  }

  async close() {
    const event = dispatch(this, "uidialogclose", { cancelable: true })
    if (event.defaultPrevented) return
    const data = omit(this.ctx.reactive.data, ["ui"])
    this.emit("close", data)
    await this.destroy()
    return data
  }

  render({ content, label, footer }) {
    const buttons = [
      {
        tag: "button.ui-dialog__close",
        picto: "close",
        on: { click: "{{close()}}" },
      },
    ]

    const def = [
      {
        tag: "header.ui-dialog__header",
        content: [{ tag: "h2.ui-dialog__title", content: label }, ...buttons],
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

  setup() {
    const rect = this.getBoundingClientRect()
    this.x ??= Math.round(rect.left)
    this.y ??= Math.round(rect.top)
    this.style.top = 0
    this.style.left = 0
    this.style.zIndex = maxZIndex("ui-dialog") + 1
    dispatch(this, "uidialogopen")
  }
}

Component.define(Dialog)

const tracker = new Map()

const dialog = rpc(
  async function dialog(def, ctx) {
    const { steps } = ctx
    let n = tracker.has(steps) ? tracker.get(steps) : 0
    ctx = { ...ctx }
    ctx.steps += ",dialog°" + n++
    tracker.set(steps, n)

    const el = new Dialog(def, ctx)
    const { opener } = el
    await el.ready

    document.body.append(el)

    autofocus(el.querySelector(":scope > .ui-dialog__body"))

    return el.once("close").then((res) => ({ res, opener }))
  },
  {
    module: import.meta.url,

    marshalling(def = {}, ctx) {
      if (!def.opener) {
        document.activeElement.id ||= uid()
        def.opener ??= document.activeElement.id
      }

      if (rpc.inTop) return [objectifyDef(def), { ...ctx }]
      return [forkDef(def, ctx), {}]
    },

    unmarshalling({ res, opener }) {
      document.querySelector(`#${opener}`)?.focus()
      return res
    },
  }
)

export default dialog
