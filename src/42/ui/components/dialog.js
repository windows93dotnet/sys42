import Component from "../class/Component.js"
import movable from "../traits/movable.js"
import realm from "../../system/realm.js"
import renderAnimation from "../renderers/renderAnimation.js"
import { objectifyDef, forkDef } from "../normalize.js"
import { autofocus } from "../../fabric/dom/focus.js"

const _axis = Symbol("axis")

export class Dialog extends Component {
  static definition = {
    tag: "ui-dialog",

    id: true,
    role: "dialog",
    tabIndex: -1,

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
  }

  #anim;

  [_axis]() {
    this.style.transform = `translate(${this.x}px, ${this.y}px)`
  }

  async close() {
    document.querySelector(this.opener)?.focus()
    this.destroy({ remove: false })
    if (this.#anim) await renderAnimation(this.ctx, this, "to", this.#anim)
    this.remove()
  }

  render({ content, label, footer, animate, to }) {
    this.#anim = to ?? animate

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

  setup({ signal }) {
    const rect = this.getBoundingClientRect()
    this.x ??= Math.round(rect.left)
    this.y ??= Math.round(rect.top)
    this.style.top = 0
    this.style.left = 0

    movable(this, {
      signal,
      throttle: false,
      handler: ".ui-dialog__title",
    })
  }
}

Component.define(Dialog)

const dialog = realm({
  name: "dialog",

  args(def, ctx) {
    if (realm.inTop) return [objectifyDef(def), ctx]
    return [forkDef(def, ctx)]
  },

  async top(def, ctx) {
    ctx.tracks.push("dialog°" + dialog.list.length)
    // console.log(ctx.tracks)
    const el = new Dialog(def, ctx)
    dialog.list.push(el)
    await el.ready
    document.body.append(el)
    autofocus(el.querySelector(":scope > .ui-dialog__body"))
  },
})

dialog.list = []

export default dialog
