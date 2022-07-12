import Component from "../class/Component.js"
import movable from "../traits/movable.js"
import realm from "../../system/realm.js"
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
        update: Component.AXIS,
      },
      y: {
        type: "number",
        update: Component.AXIS,
      },
    },

    defaults: {
      label: undefined,
      footer: undefined,
    },

    plugins: ["ipc"],
  }

  close() {
    this.ctx.cancel("dialog close")
    this.remove()
  }

  render({ content, label, footer }) {
    return [
      {
        tag: "header.ui-dialog__header",
        content: [
          { tag: "h2.ui-dialog__title", content: label },
          // { tag: "button", picto: "close", on: { click: "{{close()}}" } },
          { tag: "button", picto: "close", on: { click: () => this.close() } },
        ],
      },
      { tag: "section.ui-dialog__body", content },
      { tag: "footer.ui-dialog__footer", content: footer },
    ]
  }

  setup({ signal }) {
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
    document.body.append(el)
  },
})
