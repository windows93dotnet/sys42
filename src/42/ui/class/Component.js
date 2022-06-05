import { toKebabCase } from "../../fabric/type/string/letters.js"
import defer from "../../fabric/type/promise/defer.js"
import renderAttributes from "../renderers/renderAttributes.js"
import { normalizeCtx, normalizeDef } from "../normalize.js"
import render from "../render.js"

const CREATE = 0
const INIT = 1
const RENDER = 2
const SETUP = 3

function objectify(def) {
  if (def != null) {
    if (typeof def === "object" && !Array.isArray(def)) return def
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

  #timeout
  #observed = {}
  #lifecycle = CREATE

  constructor(...args) {
    super()
    this.ready = defer()
    if (args.length > 0 || this.parentElement !== null) this.init(...args)
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.#observed[name]?.(newValue, oldValue)
  }

  adoptedCallback() {
    if (!this.isConnected) return
    cancelIdleCallback(this.#timeout)
    this.adopted?.(this.ctx)
  }

  connectedCallback() {
    if (!this.isConnected) return
    cancelIdleCallback(this.#timeout)
    this.ready ??= defer()
    if (this.#lifecycle === RENDER) this.#setup()
    else if (this.#lifecycle === INIT) this.ready.then(() => this.#setup())
    else if (this.#lifecycle === CREATE) this.init().then(() => this.#setup())
  }

  disconnectedCallback() {
    this.#timeout = requestIdleCallback(() => {
      this.ctx.cancel(`${this.localName} disconnected`)
      this.ready = undefined
      this.#lifecycle = CREATE
    })
  }

  #setup() {
    if (this.#lifecycle === SETUP) return
    this.#lifecycle = SETUP
    this.setup?.(this.ctx)
  }

  async #init(def, ctx) {
    this.#lifecycle = INIT

    if (this.ctx === undefined) {
      const { definition } = this.constructor

      ctx = { ...ctx }
      ctx.el = this
      ctx.undones = undefined
      ctx.state = ctx.state?.fork(ctx)
      ctx.cancel = ctx.cancel?.fork()

      ctx = normalizeCtx(ctx)
      Object.defineProperty(ctx, "signal", {
        configurable: true,
        get: () => ctx.cancel.signal,
      })
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

      const prerender = await this.render?.(this.ctx)
      this.def = normalizeDef(
        { ...definition, ...objectify(prerender), ...objectify(def) },
        ctx
      )
    } else {
      this.ctx.cancel = this.ctx.cancel.parent?.fork() ?? this.ctx.cancel.fork()
    }

    if (this.def.attrs) renderAttributes(this, this.ctx, this.def.attrs)
    this.replaceChildren(render(this.def.content, this.ctx))

    await this.ctx.undones.done()

    if (this.#lifecycle === INIT) this.#lifecycle = RENDER
    if (this.isConnected) this.#setup()
  }

  async init(...args) {
    await this.#init(...args)
      .then(this.ready.resolve)
      .catch((err) => this.ready.reject(err))
  }
}
