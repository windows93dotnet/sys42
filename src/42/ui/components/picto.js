import Component from "../class/Component.js"

export class Picto extends Component {
  static definition = {
    tag: "ui-picto",

    class: "picto--{{value}}",

    props: {
      value: {
        type: "string",
        reflect: true,
      },
    },
  }

  setup() {
    if (this.tooltip) this.role = "img"
    else this.setAttribute("aria-hidden", true)
  }
}

Component.define(Picto)
