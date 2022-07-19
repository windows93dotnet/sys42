/* eslint-disable complexity */
// @read https://developer.salesforce.com/blogs/2020/01/accessibility-for-web-components
// @read https://github.com/webcomponents/gold-standard/wiki

import system from "../../system.js"
import { toKebabCase } from "../../fabric/type/string/letters.js"
import defer from "../../fabric/type/promise/defer.js"
import renderAttributes from "../renderers/renderAttributes.js"
import renderProps from "../renderers/renderProps.js"
import resolveScope from "../resolveScope.js"
import configure from "../../fabric/configure.js"
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

    /* handle props
    --------------- */
    if (definition.props || def?.props || definition.computed) {
      const { localName } = this

      let i = this.ctx.componentsIndexes[localName] ?? -1
      this.ctx.componentsIndexes[localName] = ++i

      this.ctx.globalScope = this.ctx.scope
      this.ctx.scope = resolveScope(
        this.localName,
        system.DEV ? this.ctx.steps : hash(this.ctx.steps)
      )

      this.ctx.props = definition.props
      if (definition.id === true) this.id = `${this.localName}-${i}`
    }

    def = objectifyDef(def)

    const options = {}
    let props
    if (definition.props) {
      const propsKeys = Object.keys(definition.props)
      const configKeys = Object.keys(definition.defaults ?? {})
      const entries = Object.entries(def)
      props = {}
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
    }

    this.#observed = props
      ? await renderProps(this, definition.props, props)
      : undefined

    /* handle def
    ------------- */
    def = { ...definition, ...def }
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

    /* apply
    -------- */
    if (state) this.ctx.reactive.assign(this.ctx.globalScope, state)
    if (computed) normalizeComputeds(computed, this.ctx)

    const attrs = normalizeAttrs(def, this.ctx, definition.defaults)
    if (attrs) renderAttributes(this, this.ctx, attrs)

    await this.ctx.preload.done()

    this.append(render(def, this.ctx, { skipNormalize: true }))

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

  #destroy(options) {
    if (this.#lifecycle === DESTROY || this.#lifecycle === CREATE) return
    this.#lifecycle = DESTROY

    this.#destroyCallback?.()

    if (options?.remove !== false) {
      this.replaceChildren()
      this.remove()
    }

    const reason = `${this.localName} destroyed`
    this.ctx.cancel(reason)

    if (this.ctx.globalScope) {
      this.ctx.componentsIndexes[this.localName]--
      this.ctx.reactive.delete(this.ctx.scope, { silent: true })
      this.ctx.reactive.emit("update", new Set()) // prevent calling $ref renderers
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
