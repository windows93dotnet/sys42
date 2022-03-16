import Layer from "../class/Layer.js"
import aim from "../../fabric/dom/aim.js"

export default class LayerPopups extends Layer {
  constructor(...args) {
    super(...args)
    this.aim = aim(this.el)
    this.on("delete", () => this.aim.reset())
  }

  async add(def, ctx, options) {
    const res = await super.add(def, ctx, options)

    if (options.cursor) {
      this.aim.to(res.item, options.cursor, options?.inMenubar)
    }

    return res
  }
}
