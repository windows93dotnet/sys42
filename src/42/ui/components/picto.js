import Component from "../classes/Component.js"
import create from "../create.js"
import loadSVG from "../../core/load/loadSVG.js"

const inlineds = new Set([])
const sprites = create("svg", { style: { display: "none" } })
document.body.append(sprites)

function ensureSymbol(val) {
  if (!inlineds.has(val)) {
    inlineds.add(val)
    loadSVG(
      new URL(`../../themes/default/pictos/${val}.svg`, import.meta.url)
    ).then((svg) => {
      const symbol = create("symbol")
      symbol.id = svg.id
      symbol.setAttribute("viewBox", svg.getAttribute("viewBox"))
      symbol.append(...svg.children)
      sprites.append(symbol)
    })
  }
}

export class Picto extends Component {
  static definition = {
    tag: "ui-picto",

    props: {
      value: {
        type: "string",
        reflect: true,
        storeInState: false,
        update() {
          this.use.setAttribute("href", `#${this.value}`)
          ensureSymbol(this.value)
        },
      },
    },
  }

  render() {
    return {
      tag: "svg",
      width: "16",
      height: "16",
      aria: { hidden: true },
      content: { tag: "use", entry: "use", href: "#" + this.value },
    }
  }
}

Component.define(Picto)
