import Component from "../class/Component.js"

// TODO: emoji icons https://tink.uk/accessible-emoji

class Picto extends Component {
  static definition = {
    tag: "ui-picto",
    properties: {
      value: {
        type: "string",
        reflect: true,
        render: true,
      },
    },
  }

  $render() {
    if (this.tooltip) {
      this.role = "img"
    } else {
      this.setAttribute("aria-hidden", true)
    }

    this.className = `picto--${this.value}`
  }
}

export default await Component.define(Picto)
