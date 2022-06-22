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

function objectify(def) {
  if (def != null) {
    if (typeof def === "object" && !Array.isArray(def)) return def
    return { content: def }
  }
}

export default class Component extends HTMLElement {
  static define(Class) {
    if (typeof Class === "object") {
      Class = class extends Component {
        static definition = Class
      }
    }

    let tag = Class.definition?.tag
    if (tag === undefined) {
      if (Class.name === "Class") throw new Error(`missing Component "tag"`)
      tag = `ui-${Class.name.toLowerCase()}`
    }

    if (Class.definition?.props) {
      Class.observedAttributes = []
      for (const [key, item] of Object.entries(Class.definition.props)) {
        Class.observedAttributes.push(item.attribute ?? toKebabCase(key))
      }
    }

    if (!customElements.get(tag)) customElements.define(tag, Class)
    return (...args) => new Class(...args)
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

    def = objectify(def)

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

    const config = { ...definition, ...objectify(content), ...def }
    const { computed } = config
    this.ctx.computed = computed
    delete config.computed

    this.def = normalizeDef(config, this.ctx, { attrs: false })

    if (props || config.computed) {
      const { localName } = this
      let i = this.ctx.componentsIndexes[localName] ?? -1
      this.ctx.componentsIndexes[localName] = ++i
      this.ctx.stateScope = this.ctx.scope
      this.ctx.scope = resolveScope(this.localName, String(i))
    }

    this.#observed = props
      ? await renderProps(this, definition.props, props)
      : undefined

    if (computed) normalizeComputeds(computed, this.ctx)

    const attrs = normalizeAttrs(config, this.ctx)
    if (attrs) renderAttributes(this, this.ctx, attrs)

    await 0 // queueMicrotask

    this.append(render(this.def.content, this.ctx))

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

    if (this.constructor.definition?.props || this.def.computed) {
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
