import Component from "../class/Component.js"
import movable from "../traits/movable.js"
import realm from "../../system/realm.js"
import renderAnimation from "../renderers/renderAnimation.js"
import { objectifyDef, forkDef } from "../normalize.js"

export class Dialog extends Component {
  static definition = {
    tag: "ui-dialog",

    id: true,
    role: "dialog",
    tabIndex: -1,

    props: {
      active: {
        type: "boolean",
        reflect: true,
        default: true,
      },
      x: {
        type: "number",
        update: "axis",
      },
      y: {
        type: "number",
        update: "axis",
      },
    },

    defaults: {
      label: undefined,
      footer: undefined,
    },

    plugins: ["ipc"],
  }

  #anim

  axis() {
    this.style.transform = `translate(${this.x}px, ${this.y}px)`
  }

  async close() {
    this.ctx.cancel("dialog close")
    if (this.#anim) await renderAnimation(this.ctx, this, "to", this.#anim)
    this.remove()
  }

  render({ content, label, footer, animate, to }) {
    this.#anim = to ?? animate
    return [
      {
        tag: "header.ui-dialog__header",
        content: [
          { tag: "h2.ui-dialog__title", content: label },
          // { tag: "button", picto: "close", on: { click: "{{close()}}" } },
          {
            tag: "button.ui-dialog__close",
            picto: "close",
            on: { click: () => this.close() },
          },
        ],
      },
      { tag: "section.ui-dialog__body", content },
      { tag: "footer.ui-dialog__footer", content: footer },
    ]
  }

  setup({ signal }) {
    const rect = this.getBoundingClientRect()
    this.x ??= Math.round(rect.left)
    this.y ??= Math.round(rect.top)
    this.axis()
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

export default realm({
  name: "dialog",

  args(def, ctx) {
    if (realm.inTop) return [objectifyDef(def), ctx]
    return [forkDef(def, ctx)]
  },

  async top(def, ctx) {
    const el = new Dialog(def, ctx)
    await el.ready
    document.body.append(el)
  },
})
