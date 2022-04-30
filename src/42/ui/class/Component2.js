import render from "../render.js"
import makeNewContext from "../utils/makeNewContext.js"

export default class Component extends HTMLElement {
  static async define(Class) {
    const tagName = Class.definition.tag ?? `ui-${Class.name.toLowerCase()}`
    if (!customElements.get(tagName)) customElements.define(tagName, Class)
    return (...args) => new Class(...args)
  }

  _ = {}
  #rendered = false

  constructor(...args) {
    super()
    if (args.length > 0) this.$init(...args)
  }

  connectedCallback() {
    if (!this.isConnected) return

    if (!this.#rendered) {
      this.removeAttribute("data-lazy-init")
      const def = this.$render(this._)
      if (def) render(def, this._.ctx, this)
      this.#rendered = true
    }
  }

  $init(def, ctx) {
    // console.log(args)
    this._.ctx = makeNewContext(ctx)
  }

  $render() {}
}
