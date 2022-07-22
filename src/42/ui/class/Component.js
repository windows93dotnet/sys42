// @read https://developer.salesforce.com/blogs/2020/01/accessibility-for-web-components
// @read https://github.com/webcomponents/gold-standard/wiki

import system from "../../system.js"
import { toKebabCase } from "../../fabric/type/string/letters.js"
import defer from "../../fabric/type/promise/defer.js"
import renderAttributes from "../renderers/renderAttributes.js"
import renderProps from "../renderers/renderProps.js"
import resolveScope from "../resolveScope.js"
import configure from "../../core/configure.js"
import render from "../render.js"
import hash from "../../fabric/type/any/hash.js"
import {
  objectifyDef,
  normalizeCtx,
  normalizeDef,
  normalizeString,
  normalizeComputeds,
  normalizeScope,
  normalizeAttrs,
} from "../normalize.js"

const CREATE = 0
const INIT = 1
const RENDER = 2
const SETUP = 3
const RECYCLE = 4
const DESTROY = 5

const getStep = (steps) => (system.DEV ? steps : hash(steps))

export default class Component extends HTMLElement {
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
  #animateTo
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
    this.update?.()
    this.setup?.(this.ctx)
    this.ctx.postrender.call()
  }

  #setCustomScope(props) {
    this.ctx.globalScope = this.ctx.scope
    const i = this.localName.indexOf("-")
    this.ctx.scope = resolveScope(
      this.localName.slice(0, i) + "/" + this.localName.slice(i + 1),
      getStep(this.ctx.steps)
    )
    this.ctx.props = props
  }

  async #init(def, ctx) {
    this.removeAttribute("data-no-init")
    this.#lifecycle = INIT

    const { definition } = this.constructor

    /* handle ctx
    ------------- */
    let tmp = { ...ctx }
    tmp.el = this
    tmp.component = this
    tmp.preload = undefined
    tmp.components = undefined
    tmp.postrender = undefined
    tmp.cancel = ctx?.cancel?.fork()
    tmp.steps ??= this.localName
    tmp = normalizeCtx(tmp)
    this.ctx = tmp
    normalizeScope(def, this.ctx)
    def = objectifyDef(def)

    const options = {}

    /* handle props
    --------------- */
    const configProps = configure(definition.props, def?.props)
    const propsValues = Object.values(configProps)

    if (propsValues.length > 0) {
      if (!propsValues.every((val) => val.state !== undefined)) {
        this.#setCustomScope(configProps)
      }

      const propsKeys = Object.keys(configProps)
      const configKeys = Object.keys(definition.defaults ?? {})
      const entries = Object.entries(def)
      const props = {}
      def = {}
      for (const [key, val] of entries) {
        if (propsKeys.includes(key)) {
          props[key] =
            typeof val === "string" //
              ? normalizeString(val, this.ctx)
              : val
        } else if (configKeys.includes(key)) {
          options[key] = val
        } else def[key] = val
      }

      this.#observed = await renderProps(this, configProps, props)
    }

    if (definition.computed && !this.ctx.globalScope) {
      this.#setCustomScope(configProps)
    }

    /* handle def
    ------------- */
    def = configure(definition, def)
    const { computed, state } = def
    this.ctx.computed = computed
    delete def.computed
    delete def.state
    delete def.scope
    delete def.tag

    const config = configure(definition.defaults, options)

    if (this.render) {
      Object.assign(def, objectifyDef(await this.render({ ...config, ...def })))
    }

    def = normalizeDef(def, this.ctx, { skipAttrs: true })

    this.#animateTo = def.animate?.to

    /* apply
    -------- */
    if (state) this.ctx.reactive.assign(this.ctx.globalScope, state)
    if (computed) normalizeComputeds(computed, this.ctx)

    const attrs = normalizeAttrs(def, this.ctx, definition.defaults)
    if (attrs) renderAttributes(this, this.ctx, attrs)

    await this.ctx.preload.done()

    this.replaceChildren(
      render(def, this.ctx, { skipNormalize: true, step: this.localName })
    )

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

  async #destroy(options) {
    if (this.#lifecycle === DESTROY || this.#lifecycle === CREATE) return
    this.#lifecycle = DESTROY

    this.#destroyCallback?.()

    if (options?.remove !== false) {
      if (this.isConnected && this.#animateTo) {
        // TODO: use Promise.race here
        await import("../renderers/renderAnimation.js").then((m) =>
          m.default(this.ctx, this, "to", this.#animateTo)
        )
      }

      this.replaceChildren()
      this.remove()
    }

    const reason = `${this.localName} destroyed`
    this.ctx.cancel(reason)

    if (this.ctx.globalScope) {
      this.ctx.reactive.delete(this.ctx.scope, { silent: true })
      this.ctx.reactive.emit("update", new Set([this.ctx.scope])) // prevent calling $ref renderers
    }

    this.ready?.reject?.(new Error(reason))
    this.ready = undefined
    this.#observed = undefined

    delete this.ctx.component
    delete this.ctx.el
    delete this.ctx

    this.#lifecycle = CREATE
  }
}
