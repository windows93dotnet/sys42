import Component from "../class/Component.js"

export class Dialog extends Component {
  static definition = {
    tag: "ui-dialog",

    role: "dialog",
    tabIndex: -1,

    props: {
      content: {
        type: "any",
      },
    },
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
}

Component.define(Dialog)

export default async function dialog() {
  console.log("dialog")
}
