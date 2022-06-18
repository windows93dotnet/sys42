// @read https://developer.salesforce.com/blogs/2020/01/accessibility-for-web-components
// @read https://github.com/webcomponents/gold-standard/wiki

import { toKebabCase } from "../../fabric/type/string/letters.js"
import defer from "../../fabric/type/promise/defer.js"
import renderAttributes from "../renderers/renderAttributes.js"
import renderProps from "../renderers/renderProps.js"
import configure from "../../fabric/configure.js"
import { normalizeCtx, normalizeDef, normalizeComputeds } from "../normalize.js"
import resolveScope from "../resolveScope.js"
import render from "../render.js"

const CREATE = 0
const INIT = 1
const RENDER = 2
const SETUP = 3
const RECYCLE = 4
const DESTROY = 5

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

  // TODO: put this in define
  static get observedAttributes() {
    const observed = []
    if (!this.definition?.props) return observed
    for (const [key, item] of Object.entries(this.definition.props)) {
      observed.push(item.attribute ?? toKebabCase(key))
    }

    return observed
  }

  #observed
  #lifecycle = CREATE

  constructor(...args) {
    super()
    this.ready = defer()
    if (
      args.length > 0 ||
      (this.parentElement !== null && !this.hasAttribute("data-no-init"))
    ) {
      this.init(...args)
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.#observed?.[name]?.(newValue, oldValue)
  }

  adoptedCallback() {
    // TODO: test adoptedCallback usage
  }

  connectedCallback() {
    if (!this.isConnected) return
    if (this.#lifecycle === RENDER) this.#setup()
    else if (this.#lifecycle === INIT) this.ready.then(() => this.#setup())
    else if (this.#lifecycle === CREATE) this.init().then(() => this.#setup())
    else if (this.#lifecycle === RECYCLE) this.#lifecycle = SETUP
  }

  disconnectedCallback() {
    if (this.#lifecycle >= RECYCLE) return
    this.destroy()
  }

  recycle() {
    this.#lifecycle = RECYCLE
    this.remove()
    return this
  }

  #setup() {
    if (this.#lifecycle === SETUP) return
    this.#lifecycle = SETUP
    this.setup?.(this.ctx)
  }

  async #init(def, ctx) {
    this.removeAttribute("data-no-init")
    this.#lifecycle = INIT

    const { definition } = this.constructor

    let tmp = { ...ctx }
    tmp.el = this
    tmp.components = undefined
    tmp.cancel = ctx?.cancel?.fork()
    delete this.cancelParent
    tmp = normalizeCtx(tmp)
    Object.defineProperty(tmp, "signal", { get: () => tmp.cancel.signal })
    this.ctx = tmp

    const content = await this.render?.(this.ctx)
    const config = configure(definition, objectify(content), objectify(def))
    const { computed } = config
    this.ctx.computed = computed
    delete config.computed

    this.def = normalizeDef(config, this.ctx)

    if (this.def.props || this.def.computed) {
      const { localName } = this
      let i = this.ctx.componentsIndexes[localName] ?? -1
      this.ctx.componentsIndexes[localName] = ++i
      this.ctx.stateScope = this.ctx.scope
      this.ctx.scope = resolveScope(this.localName, String(i), ctx)
    }

    this.#observed = config.props ? await renderProps(this) : undefined
    if (computed) normalizeComputeds(computed, this.ctx)

    if (this.def.attrs) renderAttributes(this, this.ctx, this.def.attrs)
    this.replaceChildren(render(this.def.content, this.ctx))

    await this.ctx.components.done()
    await this.ctx.undones.done()
    delete this.ctx.computed

    if (this.#lifecycle === INIT) this.#lifecycle = RENDER
    if (this.isConnected) this.#setup()
  }

  async init(...args) {
    this.ready ??= defer()
    await this.#init(...args)
      .then(this.ready.resolve)
      .catch((err) => this.ready.reject(err))
  }

  destroy() {
    if (this.#lifecycle === DESTROY || this.#lifecycle === CREATE) return
    this.#lifecycle = DESTROY

    this.remove()

    if (this.ctx.cancel.signal.aborted === false) {
      this.ctx.cancel(`${this.localName} destroyed`)
    }

    if (this.def.props || this.def.computed) {
      this.ctx.componentsIndexes[this.localName]--
      this.ctx.state.delete(this.ctx.scope, { silent: true })
    }

    this.ready = undefined
    this.#observed = undefined

    delete this.ctx.el
    delete this.ctx
    delete this.def

    this.#lifecycle = CREATE
  }
}
