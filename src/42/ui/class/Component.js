// @read https://developer.salesforce.com/blogs/2020/01/accessibility-for-web-components
// @read https://github.com/webcomponents/gold-standard/wiki

import { toKebabCase } from "../../fabric/type/string/letters.js"
import defer from "../../fabric/type/promise/defer.js"
import renderAttributes from "../renderers/renderAttributes.js"
import renderProps from "../renderers/renderProps.js"
import configure from "../../fabric/configure.js"
import { normalizeCtx, normalizeDef } from "../normalize.js"
import resolve from "../resolve.js"
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

  // TODO: put this in define
  static get observedAttributes() {
    const observed = []
    if (!this.definition?.props) return observed
    for (const [key, item] of Object.entries(this.definition.props)) {
      observed.push(item.attribute ?? toKebabCase(key))
    }

    return observed
  }

  #timeout
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
    cancelIdleCallback(this.#timeout)
    this.ready ??= defer()
    if (this.#lifecycle === RENDER) this.#setup()
    else if (this.#lifecycle === INIT) this.ready.then(() => this.#setup())
    else if (this.#lifecycle === CREATE) this.init().then(() => this.#setup())
  }

  disconnectedCallback() {
    this.#timeout = requestIdleCallback(() => this.destroy())
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
    tmp.cancel = this.cancelParent?.fork() ?? ctx?.cancel?.fork()
    delete this.cancelParent
    tmp = normalizeCtx(tmp)
    Object.defineProperty(tmp, "signal", { get: () => tmp.cancel.signal })
    this.ctx = tmp

    const content = await this.render?.(this.ctx)
    const config = configure(definition, objectify(content), objectify(def))
    this.def = normalizeDef(config, this.ctx)

    if (this.def.props) {
      const cpnScope = resolve(this.ctx.scope, this.localName)
      let i = this.ctx.componentsIndexes[cpnScope] ?? 0
      this.ctx.componentsIndexes[cpnScope] = ++i
      this.ctx.stateScope = this.ctx.scope
      this.ctx.scope = resolve(
        this.localName,
        resolve(String(i), this.ctx.scope.slice(1)).slice(1)
      )
      this.#observed = await renderProps(this)
    }

    if (this.def.attrs) renderAttributes(this, this.ctx, this.def.attrs)
    this.replaceChildren(render(this.def.content, this.ctx))

    await this.ctx.components.done()
    await this.ctx.undones.done()

    if (this.#lifecycle === INIT) this.#lifecycle = RENDER
    if (this.isConnected) this.#setup()
  }

  async init(...args) {
    await this.#init(...args)
      .then(this.ready.resolve)
      .catch((err) => this.ready.reject(err))
  }

  destroy() {
    if (this.ctx.cancel.signal.aborted === false) {
      this.ctx.cancel(`${this.localName} destroyed`)
    }

    this.cancelParent = this.ctx.cancel.parent
    this.#lifecycle = CREATE
    this.ready = undefined
    this.#observed = undefined

    if (this.def.props) this.ctx.state.delete(this.ctx.scope)

    delete this.ctx.el
    delete this.ctx
    delete this.def

    this.remove()
  }
}
