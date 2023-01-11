/* eslint-disable complexity */
// @read https://developer.salesforce.com/blogs/2020/01/accessibility-for-web-components
// @read https://github.com/webcomponents/gold-standard/wiki

import system from "../../system.js"
import toKebabCase from "../../fabric/type/string/case/toKebabCase.js"
import defer from "../../fabric/type/promise/defer.js"
import renderAttributes from "../renderers/renderAttributes.js"
import renderProps from "../renderers/renderProps.js"
import resolveScope from "../resolveScope.js"
import configure from "../../core/configure.js"
import render from "../render.js"
import isEmptyObject from "../../fabric/type/any/is/isEmptyObject.js"
import dispatch from "../../fabric/event/dispatch.js"
import hash from "../../fabric/type/any/hash.js"
import uid from "../../core/uid.js"
import {
  addEntry,
  ensureDef,
  objectifyDef,
  normalizeCtx,
  normalizeDef,
  normalizeString,
  normalizeComputeds,
  normalizeScope,
  normalizeData,
  normalizeAttrs,
} from "../normalize.js"

const CREATE = 0
const INIT = 1
const RENDER = 2
const SETUP = 3
const RECYCLE = 4
const DESTROY = 5

const stepsToHash = (steps) => (system.DEV ? steps : hash(steps))

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
const _lifecycle = Symbol.for("Component.lifecycle")

export default class Component extends HTMLElement {
  [_isComponent] = true

  static isComponent(val) {
    return Boolean(val?.[_isComponent])
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
  #animateTo
  #instanceDestroy
  #hasNewScope;
  [_lifecycle] = CREATE

  constructor(...args) {
    super()

    this.ready = defer()
    this.#instanceDestroy = this.destroy
    this.destroy = this.#destroy

    if (this.isRendered()) return

    const shouldInit =
      args.length > 0 ||
      (this.parentElement !== null && !this.hasAttribute("data-no-init"))

    if (shouldInit) this.init(...args)
  }

  isRendered() {
    // a component created using cloneNode(true) should not init itself
    return (
      this.firstChild?.nodeType === Node.COMMENT_NODE &&
      this.firstChild.textContent === "[rendered]"
    )
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.#observed?.[name]?.(newValue, oldValue)
  }

  adoptedCallback() {
    // TODO: test adoptedCallback usage
  }

  async connectedCallback() {
    if (!this.isConnected || this.hasAttribute("data-no-init")) return
    if (this[_lifecycle] === RENDER) {
      try {
        await this.#setup()
      } catch (err) {
        if (this.ready.isPending) this.ready.resolve()
        dispatch(this, err)
      }

      return
    }

    if (this[_lifecycle] === RECYCLE) this[_lifecycle] = SETUP
    if (this.isRendered()) return

    if (this[_lifecycle] === INIT) this.ready.then(() => this.#setup())
    else if (this[_lifecycle] === CREATE) this.init().then(() => this.#setup())
  }

  disconnectedCallback() {
    if (this[_lifecycle] >= RECYCLE) return
    this.#destroy()
  }

  recycle() {
    this[_lifecycle] = RECYCLE
    this.remove()
    return this
  }

  async #setup() {
    if (
      this[_lifecycle] === SETUP ||
      this[_lifecycle] === DESTROY ||
      this[_lifecycle] === CREATE
    ) {
      return
    }

    this[_lifecycle] = SETUP
    await this.update?.()
    await this.setup?.(this.ctx)
  }

  #setNewScope(props) {
    this.#hasNewScope = true
    this.ctx.scopeChain = structuredClone(this.ctx.scopeChain)
    this.ctx.scopeChain.push({ scope: this.ctx.scope, props })
    const i = this.localName.indexOf("-")
    let prefix = this.localName.slice(0, i)
    const suffix = this.localName.slice(i + 1)
    if (prefix === "ui") prefix = "$" + prefix
    this.ctx.scope = resolveScope(
      `${prefix}/${suffix}`,
      stepsToHash(this.ctx.steps)
    )
  }

  async #init(def, ctx, options) {
    if (ctx?.cancel?.signal.aborted) return

    this.removeAttribute("data-no-init")
    this[_lifecycle] = INIT

    const { definition } = this.constructor

    if (ctx?.component) this.parent = ctx.component

    const entry = def?.entry ?? definition?.entry
    if (entry) {
      addEntry(ctx.component, entry, this)
      delete def.entry
    }

    const parentEntry = def?.parentEntry ?? definition?.parentEntry
    if (parentEntry) {
      if (this.parent) addEntry(this, parentEntry, this.parent)
      delete def.parentEntry
    }

    /* handle ctx
    ------------- */
    this.ctx = normalizeCtx({
      ...ctx,
      el: this,
      component: this,
      refs: undefined,
      preload: undefined,
      components: undefined,
      postrender: undefined,
      traitsReady: undefined,
      cancel: ctx?.detached ? undefined : ctx?.cancel?.fork(),
      steps: ctx?.steps ?? this.localName,
    })
    this.detached = this.ctx.detached
    delete this.ctx.detached

    def = ensureDef(def, this.ctx)
    normalizeScope(def, this.ctx)
    def = objectifyDef(def)

    this.ctx.id ??= def.id ?? hash(def)

    const params = {}

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
          params[key] = val
        } else def[key] = val
      }
    }

    /* handle def attrs
    ------------------- */
    // TODO: remove this
    let attrs = normalizeAttrs(def, this.ctx, definition.defaults)
    for (const attr of Object.keys(attrs)) delete def[attr]
    if (attrs) renderAttributes(this, this.ctx, attrs)

    if (definition.id === true) this.id ||= uid()

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

    const config = configure(definition.defaults, params)

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

    if (state && options?.skipNormalize !== true) {
      normalizeData(state, this.ctx, (res, scope, options) => {
        this.ctx.reactive.merge(
          this.#hasNewScope ? this.ctx.scopeChain.at(0).scope : this.ctx.scope,
          res,
          options
        )
      })
    }

    if (computed) normalizeComputeds(computed, this.ctx)

    /* handle all attrs
    ------------------- */
    if (def.tag) {
      def.attrs = normalizeAttrs(def, this.ctx)
    } else {
      attrs = normalizeAttrs(def, this.ctx, definition.defaults)
      for (const attr of Object.keys(attrs)) delete def[attr]
      if (attrs) renderAttributes(this, this.ctx, attrs)
    }

    await this.ctx.preload.done()

    this.replaceChildren(
      render(def, this.ctx, {
        skipNormalize: true,
        step: this.localName,
      })
    )

    this.prepend(document.createComment("[rendered]"))

    await this.ctx.components.done()
    await this.ctx.undones.done()
    await this.ctx.postrender.call()

    if (this[_lifecycle] === INIT) this[_lifecycle] = RENDER
  }

  async init(...args) {
    this.ready ??= defer()
    try {
      await this.#init(...args)
      if (this.isConnected) await this.#setup()
      this.ready.resolve()
    } catch (err) {
      if (this[_lifecycle] === DESTROY || this[_lifecycle] === CREATE) return
      this.ready.resolve()
      throw err
    }
  }

  async #destroy(options) {
    if (this[_lifecycle] === DESTROY || this[_lifecycle] === CREATE) return
    this[_lifecycle] = DESTROY

    if (this.#instanceDestroy) await this.#instanceDestroy(options)

    const reason = `${this.localName} destroyed`
    this.ctx.cancel(reason)

    if (this.#hasNewScope && this.ctx.reactive.data) {
      this.ctx.reactive.delete(this.ctx.scope, { silent: true })
      const i = this.localName.indexOf("-")
      let prefix = this.localName.slice(0, i)
      const suffix = this.localName.slice(i + 1)
      if (prefix === "ui") prefix = "$" + prefix
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

    this[_lifecycle] = CREATE
  }
}
