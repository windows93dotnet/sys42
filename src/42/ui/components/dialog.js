import Component from "../class/Component.js"
import movable from "../traits/movable.js"
import realm from "../../system/realm.js"
import normalize, { objectifyDef, forkDef } from "../normalize.js"

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

  render({ content, label, title }) {
    return [
      {
        tag: "header.ui-dialog__header",
        content: [
          { tag: "h2.ui-dialog__title", content: title ?? label },
          // { tag: "button", picto: "close" },
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

export default realm(
  async (def, ctx) => {
    if (realm.inTop) return [objectifyDef(def), ctx]
    return [forkDef(def, ctx)]
  },
  async function dialog(...args) {
    const [def, ctx] = normalize(...args)
    const el = new Dialog(def, ctx)
    document.body.append(el)
    await el.ready
    console.log(444, ctx.reactive.data["ui-dialog"][0])
  }
)
