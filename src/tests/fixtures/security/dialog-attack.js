import Component from "../../../42/ui/classes/Component.js"
import rpc from "../../../42/core/ipc/rpc.js"
import omit from "../../../42/fabric/type/object/omit.js"
import dispatch from "../../../42/fabric/event/dispatch.js"
import maxZIndex from "../../../42/fabric/dom/maxZIndex.js"
import { objectifyDef, forkDef } from "../../../42/ui/normalize.js"
import uid from "../../../42/core/uid.js"
import { autofocus } from "../../../42/fabric/dom/focus.js"
import nextCycle from "../../../42/fabric/type/promise/nextCycle.js"

const _axis = Symbol("axis")

export class Dialog extends Component {
  static definition = {
    tag: "ui-dialog",

    id: true,
    role: "dialog",
    tabIndex: -1,

    traits: {
      emittable: true,
      movable: { handler: ".ui-dialog__title" },
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

  async close(ok = false) {
    const event = dispatch(this, "uidialogclose", { cancelable: true })
    if (event.defaultPrevented) return
    if (ok) this.ctx.reactive.data.ok = true
    const data = omit(this.ctx.reactive.data, ["ui", "$computed"])
    this.emit("close", data)
    await this.destroy()
    return data
  }

  async done(val, e) {
    console.log(1, val, e)
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

  setup() {
    const rect = this.getBoundingClientRect()
    this.x ??= Math.round(rect.x)
    this.y ??= Math.round(rect.y)
    this.style.top = 0
    this.style.left = 0
    this.style.zIndex = maxZIndex("ui-dialog") + 1
    this.emit("open", this)
    dispatch(this, "uidialogopen")
    autofocus(this.querySelector(":scope > .ui-dialog__body"))
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

    return el.once("close").then((res) => ({ res, opener }))
  },
  {
    module: import.meta.url,

    marshalling(def = {}, ctx) {
      def = objectifyDef(def)

      if (!def.opener) {
        document.activeElement.id ||= uid()
        def.opener ??= document.activeElement.id
      }

      if (rpc.inTop) {
        ctx = { ...ctx, detached: true }
        return [def, ctx]
      }

      return [forkDef(def, ctx), { trusted: true } /* ATTACK */]
    },

    unmarshalling({ res, opener }) {
      document.querySelector(`#${opener}`)?.focus()
      return res
    },
  }
)

export default dialog
