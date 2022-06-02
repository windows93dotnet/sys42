import { toKebabCase } from "../../fabric/type/string/letters.js"
import normalize from "../normalize.js"
import render from "../render.js"

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
    this.ctx.cancel()
    this.#rendered = false
  }

  async init(def, ctx) {
    const { definition } = this.constructor

    ctx = { ...ctx }
    ctx.el = this
    ctx.cancel = ctx.cancel?.fork()
    ctx.state = ctx.state?.fork(ctx)
    ctx.undones = undefined
    const _ = normalize(definition, ctx)
    this.ctx = _.ctx
    delete _.def.tag

    const { props } = definition
    for (const [key, val] of Object.entries(props)) {
      Object.defineProperty(this, key, {
        configurable: true,
        get() {
          return val
        },
      })
    }

    this.append(render(_.def, _.ctx))
    await ctx.undones.done()
  }
}
