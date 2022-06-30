import Component from "../class/Component.js"

export class Dialog extends Component {
  static definition = {
    tag: "ui-dialog",

    role: "dialog",
    tabIndex: -1,

    props: {
      content: {
        type: "any",
        update: true,
      },
    },

    content: [
      { tag: "header.ui-dialog__header", content: "title" },
      { tag: "section.ui-dialog__content", content: "{{render(content)}}" },
      { tag: "footer.ui-dialog__footer" },
    ],
  }
}

Component.define(Dialog)

export default async function dialog() {
  console.log("dialog")
}
