import Layer from "../class/Layer.js"
import aim from "../../fabric/dom/aim.js"

export default class LayerPopups extends Layer {
  constructor(...args) {
    super(...args)
    this.aim = aim(this.el)
    this.on("delete", () => {
      this.aim.reset()
      this.cancel?.()
    })
  }

  async add(def, ctx, options) {
    const res = await super.add(def, ctx, options)

    if (options.cursor) {
      this.aim.to(res.item, options.cursor, options?.inMenubar)
    }

    const { activeElement } = document
    if (activeElement.localName !== "iframe") {
      this.cancel = ctx.cancel.fork()
      const { signal } = this.cancel
      activeElement.addEventListener(
        "pointerout",
        (e) => {
          if (e.relatedTarget !== this.aim.polygon) {
            this.aim.polygon.style.display = "none"
          }
        },
        { signal }
      )
      activeElement.addEventListener(
        "pointerover",
        () => {
          this.aim.polygon.style.display = "block"
        },
        { signal }
      )
    }

    return res
  }
}
