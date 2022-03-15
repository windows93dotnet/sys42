import clipboard from "../../system/clipboard.js"

import Component from "../class/Component.js"

class Swatch extends Component {
  static definition = {
    tag: "ui-swatch",
    properties: {
      value: {
        type: "string",
        reflect: true,
        render: true,
        css: "color",
      },
    },
  }

  $create() {
    this.onclick = () => clipboard.copy(this.value)
  }
}

export default await Component.define(Swatch)
