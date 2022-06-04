import { toKebabCase } from "../../fabric/type/string/letters.js"
import configure from "../../fabric/configure.js"
import { normalizeCtx, normalizeDef } from "../normalize.js"
import render from "../render.js"

function objectify(def) {
  if (def != null) {
    if (typeof def === "object") return def
    return { content: def }
  }
}

export default class Component extends HTMLElement {
  static async define(Class) {
    if (typeof Class === "object") {
      Class = class extends Component {
        static definition = Class
      }
    }

    let tagName = Class.definition.tag
    if (tagName === undefined) {
      if (Class.name === "Class") throw new Error(`missing Component "tag"`)
      tagName = `ui-${Class.name.toLowerCase()}`
    }

    customElements.define(tagName, Class)
    return (...args) => new Class(...args)
  }

  static get observedAttributes() {
    const observed = []
    if (!this.definition?.props) return observed
    for (const [key, item] of Object.entries(this.definition.props)) {
      observed.push(item.attribute ?? toKebabCase(key))
    }

    return observed
  }

  #rendered = false
  #observed = {}

  constructor(...args) {
    super()
    if (args.length > 0) this.init(...args)
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.#observed[name]?.(newValue, oldValue)
  }

  connectedCallback() {
    if (!this.isConnected) return
    if (!this.#rendered) this.init()
  }

  disconnectedCallback() {
    this.ctx.cancel(`${this.localName} disconnected`)
    this.#rendered = false
  }

  async init(def, ctx) {
    const { definition } = this.constructor

    ctx = { ...ctx }
    ctx.el = this
    ctx.cancel = ctx.cancel?.fork()
    ctx.state = ctx.state?.fork(ctx)
    ctx.undones = undefined

    ctx = normalizeCtx(ctx)
    this.ctx = ctx

    if (definition.props) {
      for (const [key, val] of Object.entries(definition.props)) {
        Object.defineProperty(this, key, {
          configurable: true,
          get() {
            return val
          },
        })
      }
    }

    const prerender = await this.prerender?.(ctx)
    def = configure(definition, objectify(prerender), objectify(def))
    def = normalizeDef(def, ctx)
    delete def.tag
    await ctx.undones.done()

    this.append(render(def, ctx))
    await ctx.undones.done()

    await this.postrender?.(ctx)
    await ctx.undones.done()

    this.#rendered = true
  }
}
