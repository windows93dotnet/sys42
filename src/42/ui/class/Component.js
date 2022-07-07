// @read https://developer.salesforce.com/blogs/2020/01/accessibility-for-web-components
// @read https://github.com/webcomponents/gold-standard/wiki

import { toKebabCase } from "../../fabric/type/string/letters.js"
import defer from "../../fabric/type/promise/defer.js"
import renderAttributes from "../renderers/renderAttributes.js"
import renderProps from "../renderers/renderProps.js"
import resolveScope from "../resolveScope.js"
import render from "../render.js"
import {
  normalizeCtx,
  normalizeDef,
  normalizeString,
  normalizeComputeds,
  normalizeAttrs,
} from "../normalize.js"

const CREATE = 0
const INIT = 1
const RENDER = 2
const SETUP = 3
const RECYCLE = 4
const DESTROY = 5

const _AXIS = Symbol("AXIS")

function objectify(def) {
  if (def != null) {
    if (typeof def === "object" && !Array.isArray(def)) return def
    return { content: def }
  }
}

export default class Component extends HTMLElement {
  static AXIS = _AXIS;

  [_AXIS]() {
    this.style.transform = `translate(${this.x}px, ${this.y}px)`
  }

  static define(Class) {
    if (typeof Class === "object") {
      Class = class extends Component {
        static definition = Class
      }
    }

    Class.definition ??= {}

    const out = (...args) => new Class(...args)

    let { tag } = Class.definition

    if (tag === undefined) {
      if (Class.name === "Class") throw new Error(`missing Component "tag"`)
      tag = `ui-${Class.name.toLowerCase()}`
    }

    if (customElements.get(tag)) return out

    if (Class.definition.props) {
      Class.observedAttributes = []
      for (const [key, item] of Object.entries(Class.definition.props)) {
        Class.observedAttributes.push(item.attribute ?? toKebabCase(key))
      }
    }

    customElements.define(tag, Class)
    return out
  }

  #observed
  #destroyCallback
  #lifecycle = CREATE

  constructor(...args) {
    super()
    this.ready = defer()
    this.#destroyCallback = this.destroy
    this.destroy = this.#destroy
    const shouldInit =
      args.length > 0 ||
      (this.parentElement !== null && !this.hasAttribute("data-no-init"))
    if (shouldInit) this.init(...args)
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.#observed?.[name]?.(newValue, oldValue)
  }

  adoptedCallback() {
    // TODO: test adoptedCallback usage
  }

  connectedCallback() {
    if (!this.isConnected || this.hasAttribute("data-no-init")) return
    if (this.#lifecycle === RENDER) this.#setup()
    else if (this.#lifecycle === INIT) this.ready.then(() => this.#setup())
    else if (this.#lifecycle === CREATE) this.init().then(() => this.#setup())
    else if (this.#lifecycle === RECYCLE) this.#lifecycle = SETUP
  }

  disconnectedCallback() {
    if (this.#lifecycle >= RECYCLE) return
    this.#destroy()
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
    this.update?.()

    // TODO: add "setup" keyword in renderProps
    if ("x" in this && "y" in this) {
      const rect = this.getBoundingClientRect()
      this.x ??= Math.round(rect.x)
      this.y ??= Math.round(rect.y)
      this.style.top = 0
      this.style.left = 0
    }
  }

  async #init(def, ctx) {
    this.removeAttribute("data-no-init")
    this.#lifecycle = INIT

    const { definition } = this.constructor

    let tmp = { ...ctx }
    tmp.el = this
    tmp.components = undefined
    tmp.cancel = ctx?.cancel?.fork()
    tmp = normalizeCtx(tmp)
    this.ctx = tmp

    if (definition.props || definition.computed) {
      const { localName } = this

      const i = this.ctx.reactive.data[localName]
        ? Object.keys(this.ctx.reactive.data[localName]).length
        : 0

      this.ctx.globalScope = this.ctx.scope
      this.ctx.scope = resolveScope(this.localName, String(i))
      this.ctx.props = definition.props
      if (definition.id === true) this.id = `${this.localName}-${i}`
    }

    let props
    if (definition.props) {
      const propsKeys = Object.keys(definition.props)
      const entries = Object.entries(def)
      props = {}
      def = {}
      for (const [key, val] of entries) {
        if (propsKeys.includes(key)) {
          props[key] =
            typeof val === "string" ? normalizeString(val, this.ctx) : val
        } else def[key] = val
      }
    }

    this.#observed = props
      ? await renderProps(this, definition.props, props)
      : undefined

    const config = { ...definition, ...objectify(def) }
    const { computed } = config
    this.ctx.computed = computed
    delete config.computed

    def = normalizeDef(config, this.ctx, { attrs: false })
    def = this.render ? objectify(this.render(def)) : def

    if (computed) normalizeComputeds(computed, this.ctx)

    const attrs = normalizeAttrs(config, this.ctx)
    if (attrs) renderAttributes(this, this.ctx, attrs)

    this.append(render(def.content, this.ctx))

    await this.ctx.components.done()
    await this.ctx.undones.done()
    delete this.ctx.computed

    if (this.#lifecycle === INIT) this.#lifecycle = RENDER
    if (this.isConnected) this.#setup()
  }

  async init(...args) {
    this.ready ??= defer()
    try {
      await this.#init(...args)
      this.ready.resolve()
    } catch (err) {
      this.ready.reject(err)
      throw err
    }
  }

  #destroy() {
    if (this.#lifecycle === DESTROY || this.#lifecycle === CREATE) return
    this.#lifecycle = DESTROY

    this.#destroyCallback?.()
    this.replaceChildren()
    this.remove()

    if (this.ctx.cancel.signal.aborted === false) {
      this.ctx.cancel(`${this.localName} destroyed`)
    }

    const { definition } = this.constructor

    if (definition.props || definition.computed) {
      this.ctx.reactive.delete(this.ctx.scope, { silent: true })
    }

    this.ready = undefined
    this.#observed = undefined

    delete this.ctx.el
    delete this.ctx

    this.#lifecycle = CREATE
  }
}
