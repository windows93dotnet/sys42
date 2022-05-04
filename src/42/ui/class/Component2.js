import render from "../render.js"
import normalizeDefinition from "../utils/normalizeDefinition.js"
import makeNewContext from "../utils/makeNewContext.js"
import renderAttributes from "../renderers/renderAttributes.js"

export default class Component extends HTMLElement {
  static async define(Class) {
    const tagName = Class.definition.tag ?? `ui-${Class.name.toLowerCase()}`
    customElements.define(tagName, Class)
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
    if (!this.#rendered && !this.hasAttribute("data-lazy-init")) {
      this.$init()
    }
  }

  $init(...args) {
    this.removeAttribute("data-lazy-init")
    const { definition } = this.constructor
    const out = normalizeDefinition(definition, ...args)
    this._.ctx = makeNewContext(out.ctx)

    if (out.attrs) renderAttributes(this, this._.ctx, out.attrs)

    // console.log(out)

    const def = "$render" in this ? this.$render(this._) : out.def.content
    if (def) render(def, this._.ctx, this)
    this.#rendered = true
  }
}
