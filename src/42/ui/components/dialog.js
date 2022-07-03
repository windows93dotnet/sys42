import Component from "../class/Component.js"
import movable from "../traits/movable.js"

export class Dialog extends Component {
  static definition = {
    tag: "ui-dialog",

    role: "dialog",
    tabIndex: -1,

    props: {
      active: {
        type: "boolean",
        reflect: true,
        default: true,
      },
      content: {
        type: "any",
      },
      x: {
        type: "number",
        default: 0,
        update: "pos",
      },
      y: {
        type: "number",
        default: 0,
        update: "pos",
      },
    },
  }

  pos() {
    this.style.transform = `translate(${this.x}px, ${this.y}px)`
  }

  render() {
    return [
      {
        tag: "header.ui-dialog__header",
        content: [
          {
            tag: "h2.ui-dialog__title",
            content: "title",
          },
          {
            tag: "button",
            picto: "close",
          },
        ],
      },
      { tag: "section.ui-dialog__content", content: "{{render(content)}}" },
      { tag: "footer.ui-dialog__footer" },
    ]
  }

  setup({ signal }) {
    movable(this, { signal, throttle: false })
  }
}

Component.define(Dialog)

export default async function dialog() {
  console.log("dialog")
}
