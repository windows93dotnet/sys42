import Component from "../classes/Component.js"
import create from "../create.js"
import render from "../render.js"
import loadSVG from "../../core/load/loadSVG.js"
import fs from "../../core/fs.js"

const inlineds = new Set()
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
  static plan = {
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

    const isString = type === "string"

    if (!isString || this.value.includes("/")) {
      let src = this.value
      if (
        !isString ||
        !(
          this.value.endsWith(".png") ||
          this.value.endsWith(".jpg") ||
          this.value.endsWith(".gif") ||
          this.value.endsWith(".svg") ||
          this.value.endsWith(".webm") ||
          this.value.endsWith(".ico")
        )
      ) {
        const { themeManager } = await import(
          "../../os/managers/themeManager.js"
        )
        src = await themeManager.getIconPath(this.value, "16x16")
      }

      src = await fs.getURL(src)

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
        on: {
          load() {
            URL.revokeObjectURL(src)
          },
        },
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

export default Component.define(Picto)
