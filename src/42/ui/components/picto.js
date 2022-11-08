import Component from "../classes/Component.js"

export class Picto extends Component {
  static definition = {
    tag: "ui-picto",

    props: {
      value: {
        type: "string",
        reflect: true,
        storeInState: false,
        update() {
          this.className = `picto--${this.value}`
        },
      },
    },
  }

  setup() {
    if (this.tooltip) this.setAttribute("role", "img")
    else this.setAttribute("aria-hidden", true)
  }
}

Component.define(Picto)
