import Component from "../classes/Component.js"
import create from "../create.js"
import render from "../render.js"
import loadSVG from "../../core/load/loadSVG.js"

const inlineds = new Set([])
const sprites = create("svg#picto-sprites", {
  style: { display: "none" },
  aria: { hidden: true },
})
document.documentElement.append(sprites)

const visual = {
  width: "16",
  height: "16",
  draggable: false,
  aria: { hidden: true },
}

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
      },
    },
  }

  async update() {
    const type = typeof this.value

    if (type !== "string" || this.value.includes("/")) {
      let src = this.value
      if (type !== "string" || !this.value.includes(".")) {
        src = await import("../../os/managers/themeManager.js").then(
          async ({ themeManager }) => {
            await themeManager.ready
            return themeManager.getIconPath(this.value, 16)
          }
        )
      }

      if (this.rasterImage) {
        this.rasterImage.src = src
        return
      }

      if (this.vectorImage) {
        this.vectorImage.remove()
        this.vectorImage = undefined
      }

      this.rasterImage = render({
        tag: "img",
        entry: "rasterImage",
        fetchpriority: "high",
        decoding: "async",
        ...visual,
        src,
      })

      this.append(this.rasterImage)
      return
    }

    ensureSymbol(this.value)

    const href = "#picto-" + this.value

    if (this.vectorImage) {
      this.vectorImage.firstChild.setAttribute("href", href)
      return
    }

    if (this.rasterImage) {
      this.rasterImage.remove()
      this.rasterImage = undefined
    }

    this.vectorImage = render({
      tag: "svg",
      entry: "vectorImage",
      ...visual,
      content: {
        tag: "use",
        entry: "use",
        href,
      },
    })

    this.append(this.vectorImage)
  }
}

Component.define(Picto)
