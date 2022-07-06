import Component from "../class/Component.js"
import movable from "../traits/movable.js"

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
  }

  render({ content, label }) {
    return [
      {
        tag: "header.ui-dialog__header",
        content: [
          { tag: "h2.ui-dialog__title", content: label },
          { tag: "button", picto: "close" },
        ],
      },
      { tag: "section.ui-dialog__body", content },
      { tag: "footer.ui-dialog__footer" },
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

export default async function dialog(def, ctx) {
  document.body.append(new Dialog(def, ctx))
}
