/* eslint-disable complexity */
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
import isEmptyObject from "../../fabric/type/any/is/isEmptyObject.js"
import dispatch from "../../fabric/event/dispatch.js"
import hash from "../../fabric/type/any/hash.js"
import {
  ensureDef,
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

function filterPropsKeys(configProps) {
  const out = []
  for (const key in configProps) {
    if (
      Object.hasOwn(configProps, key) &&
      configProps[key].storeInState !== false &&
      configProps[key].storeInRootState !== true
    ) {
      out.push(key)
    }
  }

  return out
}

const _isComponent = Symbol.for("Component.isComponent")

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

  [_isComponent] = true

  static isComponent(el) {
    return el?.[_isComponent]
  }

  #observed
  #animateTo
  #destroyCallback
  #hasNewScope
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

  async connectedCallback() {
    if (!this.isConnected || this.hasAttribute("data-no-init")) return
    if (this.#lifecycle === RENDER) {
      try {
        await this.#setup()
      } catch (err) {
        if (this.ready.isPending) this.ready.resolve()
        dispatch(this, err)
      }
    } else if (this.#lifecycle === INIT) this.ready.then(() => this.#setup())
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

  async #setup() {
    if (
      this.#lifecycle === SETUP ||
      this.#lifecycle === DESTROY ||
      this.#lifecycle === CREATE
    ) {
      return
    }

    this.#lifecycle = SETUP
    await this.update?.()
    await this.setup?.(this.ctx)
    this.ctx.postrender.call()
  }

  #setNewScope(props) {
    this.#hasNewScope = true
    this.ctx.scopeChain = structuredClone(this.ctx.scopeChain)
    this.ctx.scopeChain.push({ scope: this.ctx.scope, props })
    const i = this.localName.indexOf("-")
    this.ctx.scope = resolveScope(
      this.localName.slice(0, i) + "/" + this.localName.slice(i + 1),
      getStep(this.ctx.steps)
    )
  }

  async #init(def, ctx) {
    if (ctx?.cancel?.signal.aborted) return

    this.removeAttribute("data-no-init")
    this.#lifecycle = INIT

    const { definition } = this.constructor

    /* handle ctx
    ------------- */
    this.ctx = normalizeCtx({
      ...ctx,
      el: this,
      component: this,
      preload: undefined,
      components: undefined,
      postrender: undefined,
      cancel: ctx?.detached ? undefined : ctx?.cancel?.fork(),
      steps: ctx?.steps ?? this.localName,
    })
    delete this.ctx.detached

    def = ensureDef(def, this.ctx)
    normalizeScope(def, this.ctx)
    def = objectifyDef(def)

    const options = {}

    /* handle props
    --------------- */
    const configProps = configure(definition.props, def?.props)
    const filteredPropsKeys = filterPropsKeys(configProps)

    const props = {}
    const propsKeys = Object.keys(configProps)
    if (propsKeys.length > 0) {
      const configKeys = Object.keys(definition.defaults ?? {})
      const entries = Object.entries(def)
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

    /* handle def attrs
    ------------------- */
    let attrs = normalizeAttrs(def, this.ctx, definition.defaults)
    for (const attr of Object.keys(attrs)) delete def[attr]
    if (attrs) renderAttributes(this, this.ctx, attrs)

    /* handle def
    ------------- */
    def = configure(definition, def)
    const { computed, state } = def

    delete def.computed
    delete def.state
    delete def.scope
    delete def.props
    delete def.tag

    /* apply props
    -------------- */
    if (propsKeys.length > 0) {
      if (filteredPropsKeys.length > 0) {
        this.#setNewScope(filteredPropsKeys)
      }

      this.#observed = await renderProps(this, configProps, props)
    }

    if (computed) {
      const computedKeys = Object.keys(computed)
      if (this.#hasNewScope) {
        this.ctx.scopeChain.at(-1).props.push(...computedKeys)
      } else {
        this.#setNewScope([...filteredPropsKeys, ...computedKeys])
      }
    }

    const config = configure(definition.defaults, options)

    if (this.render) {
      const renderConfig = { ...config }
      for (const key of propsKeys) {
        Object.defineProperty(renderConfig, key, { get: () => this[key] })
      }

      for (const [key, val] of Object.entries(def)) {
        Object.defineProperty(renderConfig, key, {
          get() {
            delete def[key] // not needed anymore if used in render
            return val
          },
        })
      }

      Object.assign(def, objectifyDef(await this.render(renderConfig)))
    }

    def = normalizeDef(def, this.ctx, { skipAttrs: true })

    this.#animateTo = def.animate?.to

    /* apply
    -------- */
    if (state) {
      this.ctx.reactive.merge(
        this.#hasNewScope ? this.ctx.scopeChain.at(0).scope : this.ctx.scope,
        state
      )
    }

    if (computed) normalizeComputeds(computed, this.ctx)

    /* handle all attrs
    ------------------- */
    attrs = normalizeAttrs(def, this.ctx, definition.defaults)
    for (const attr of Object.keys(attrs)) delete def[attr]
    if (attrs) renderAttributes(this, this.ctx, attrs)

    await this.ctx.preload.done()

    this.replaceChildren(
      render(def, this.ctx, { skipNormalize: true, step: this.localName })
    )

    await this.ctx.components.done()
    await this.ctx.undones.done()

    if (this.#lifecycle === INIT) this.#lifecycle = RENDER
  }

  async init(...args) {
    this.ready ??= defer()
    try {
      await this.#init(...args)
      if (this.isConnected) await this.#setup()
      this.ready.resolve()
    } catch (err) {
      this.ready.resolve()
      throw err
    }
  }

  async #destroy(options) {
    if (this.#lifecycle === DESTROY || this.#lifecycle === CREATE) return
    this.#lifecycle = DESTROY

    this.#destroyCallback?.()

    const reason = `${this.localName} destroyed`
    this.ctx.cancel(reason)

    if (this.#hasNewScope && this.ctx.reactive.data) {
      this.ctx.reactive.delete(this.ctx.scope, { silent: true })
      const i = this.localName.indexOf("-")
      const prefix = this.localName.slice(0, i)
      const suffix = this.localName.slice(i + 1)
      if (isEmptyObject(this.ctx.reactive.data[prefix]?.[suffix])) {
        delete this.ctx.reactive.data[prefix][suffix]
      }

      if (isEmptyObject(this.ctx.reactive.data[prefix])) {
        delete this.ctx.reactive.data[prefix]
      }

      const changes = new Set([this.ctx.scope])
      this.ctx.reactive.emit("update", changes, changes) // prevent calling $ref renderers
    }

    this.ready.resolve()
    this.ready = undefined
    this.#observed = undefined

    if (options?.remove !== false) {
      if (this.isConnected && this.#animateTo) {
        await import("../renderers/renderAnimation.js").then((m) =>
          m.default(this.ctx, this, "to", this.#animateTo)
        )
      }

      this.replaceChildren()
      this.remove()
    }

    delete this.ctx.component
    delete this.ctx.el
    delete this.ctx

    this.#lifecycle = CREATE
  }
}
