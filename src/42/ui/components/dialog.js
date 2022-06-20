import Component from "../class/Component.js"

export class Dialog extends Component {
  static definition = {
    tag: "ui-dialog",

    role: "dialog",
    tabIndex: -1,
  }
}

Component.define(Dialog)

export default async function dialog() {
  console.log("dialog")
}
