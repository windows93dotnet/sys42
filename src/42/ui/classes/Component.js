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
  ensurePlan,
  objectifyPlan,
  normalizeStage,
  normalizePlan,
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

const _INSTANCES = Symbol.for("Trait.INSTANCES")

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
        static plan = Class
      }
    }

    Class.plan ??= {}

    const out = (...args) => new Class(...args)

    let { tag } = Class.plan

    if (tag === undefined) {
      if (Class.name === "Class") throw new Error(`missing Component "tag"`)
      tag = `ui-${Class.name.toLowerCase()}`
    }

    if (customElements.get(tag)) return out

    if (Class.plan.props) {
      Class.observedAttributes = []
      for (const [key, item] of Object.entries(Class.plan.props)) {
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
    await this.setup?.(this.stage)
  }

  #setNewScope(props) {
    this.#hasNewScope = true
    this.stage.scopeChain = structuredClone(this.stage.scopeChain)
    this.stage.scopeChain.push({ scope: this.stage.scope, props })
    const i = this.localName.indexOf("-")
    let prefix = this.localName.slice(0, i)
    const suffix = this.localName.slice(i + 1)
    if (prefix === "ui") prefix = "$" + prefix
    this.stage.scope = resolveScope(
      `${prefix}/${suffix}`,
      stepsToHash(this.stage.steps)
    )
  }

  async #init(plan, stage, options) {
    if (stage?.cancel?.signal.aborted) return

    this.removeAttribute("data-no-init")
    this[_lifecycle] = INIT

    const cpnPlan = this.constructor.plan

    if (stage?.component) this.parent = stage.component

    // const entry = plan?.entry ?? cpnPlan?.entry
    // if (entry) {
    //   console.log(777, entry)
    //   addEntry(stage.component, entry, this)
    //   delete plan.entry
    // }

    const parentEntry = plan?.parentEntry ?? cpnPlan?.parentEntry
    if (parentEntry) {
      if (this.parent) addEntry(this, parentEntry, this.parent)
      delete plan.parentEntry
    }

    /* handle stage
    ------------- */
    this.stage = normalizeStage({
      ...stage,
      el: this,
      component: this,
      refs: undefined,

      pendingDone: undefined,
      waitlistPreload: undefined,
      // waitlistPending: undefined,
      waitlistComponents: undefined,
      waitlistPostrender: undefined,
      waitlistTraits: undefined,

      scopeResolvers: undefined,
      cancel: stage?.detached ? undefined : stage?.cancel?.fork(),
      steps: stage?.steps ?? this.localName,
    })
    this.detached = this.stage.detached
    delete this.stage.detached

    plan = ensurePlan(plan, this.stage)
    normalizeScope(plan, this.stage)
    plan = objectifyPlan(plan)

    this.stage.id ??= plan.id ?? hash(plan)

    const params = {}

    /* handle props
    --------------- */
    const configProps = configure(cpnPlan.props, plan?.props)
    const filteredPropsKeys = filterPropsKeys(configProps)

    const props = {}
    const propsKeys = Object.keys(configProps)

    if (propsKeys.length > 0) {
      const configKeys = Object.keys(cpnPlan.defaults ?? {})
      const entries = Object.entries(plan)
      plan = {}
      for (const [key, val] of entries) {
        if (propsKeys.includes(key)) {
          props[key] =
            typeof val === "string" //
              ? normalizeString(val, this.stage)
              : val
        } else if (configKeys.includes(key)) {
          params[key] = val
        } else plan[key] = val
      }
    }

    /* handle plan attrs
    ------------------- */
    // TODO: remove this
    let attrs = normalizeAttrs(plan, this.stage, cpnPlan.defaults)
    for (const attr of Object.keys(attrs)) delete plan[attr]
    if (attrs) renderAttributes(this, this.stage, attrs)

    if (cpnPlan.id === true) this.id ||= uid()

    /* handle plan
    ------------- */
    plan = configure(cpnPlan, plan)
    const { computed, state } = plan

    delete plan.computed
    delete plan.state
    delete plan.scope
    delete plan.props
    delete plan.tag

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
        this.stage.scopeChain.at(-1).props.push(...computedKeys)
      } else {
        this.#setNewScope([...filteredPropsKeys, ...computedKeys])
      }
    }

    const config = configure(cpnPlan.defaults, params)

    if (this.render) {
      const renderConfig = { ...config }

      // [1] not needed anymore if used in render

      for (const key of propsKeys) {
        Object.defineProperty(renderConfig, key, {
          get: () => {
            if (key in plan.traits) delete plan.traits[key] // [1]
            delete plan[key] // [1]
            return this[key]
          },
        })
      }

      for (const [key, val] of Object.entries(plan)) {
        Object.defineProperty(renderConfig, key, {
          get() {
            if (key in plan.traits) delete plan.traits[key] // [1]
            delete plan[key] // [1]
            return val
          },
        })
      }

      Object.assign(plan, objectifyPlan(await this.render(renderConfig)))
    }

    plan = normalizePlan(plan, this.stage, { skipAttrs: true })

    this.#animateTo = plan.animate?.to

    /* apply
    -------- */

    if (state && options?.skipNormalize !== true) {
      normalizeData(state, this.stage, (res, scope, options) => {
        this.stage.reactive.merge(
          this.#hasNewScope
            ? this.stage.scopeChain.at(0).scope
            : this.stage.scope,
          res,
          options
        )
      })
    }

    if (computed) normalizeComputeds(computed, this.stage)

    /* handle all attrs
    ------------------- */
    if (plan.tag) {
      plan.attrs = normalizeAttrs(plan, this.stage)
    } else {
      attrs = normalizeAttrs(plan, this.stage, cpnPlan.defaults)
      for (const attr of Object.keys(attrs)) delete plan[attr]
      if (attrs) renderAttributes(this, this.stage, attrs)
    }

    if (this.stage.waitlistPreload.length > 0) {
      await this.stage.waitlistPreload.done()
    }

    let traitsPending

    if (plan.traits) {
      traitsPending = []
      for (const name of Object.keys(plan.traits)) {
        if (
          name in this === false ||
          this.constructor.plan?.props?.[name]?.trait === true
        ) {
          const deferred = defer()
          traitsPending.push([name, deferred])
          Object.defineProperty(this, name, {
            configurable: true,
            get: () => deferred,
          })
        }
      }
    }

    this.replaceChildren(
      render(plan, this.stage, {
        skipNormalize: true,
        step: this.localName,
      })
    )

    this.prepend(document.createComment("[rendered]"))

    if (traitsPending) {
      this.stage.waitlistTraits.done().then(() => {
        for (const [name, promise] of traitsPending) {
          const trait = this[_INSTANCES][name]
          promise.resolve(trait)
          Object.defineProperty(this, name, {
            configurable: true,
            get: () => trait,
          })
        }
      })
    }

    await this.stage.pendingDone()
    if (this.stage.waitlistPostrender.length > 0) {
      await this.stage.waitlistPostrender.call()
    }

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
    this.stage.cancel(reason)

    if (this.#hasNewScope && this.stage.reactive.data) {
      this.stage.reactive.delete(this.stage.scope, { silent: true })
      const i = this.localName.indexOf("-")
      let prefix = this.localName.slice(0, i)
      const suffix = this.localName.slice(i + 1)
      if (prefix === "ui") prefix = "$" + prefix
      if (isEmptyObject(this.stage.reactive.data[prefix]?.[suffix])) {
        delete this.stage.reactive.data[prefix][suffix]
      }

      if (isEmptyObject(this.stage.reactive.data[prefix])) {
        delete this.stage.reactive.data[prefix]
      }

      const changes = new Set([this.stage.scope])
      this.stage.reactive.emit("update", changes, changes) // prevent calling $ref renderers
    }

    this.ready.resolve()
    this.ready = undefined
    this.#observed = undefined

    if (options?.remove !== false) {
      if (this.isConnected && this.#animateTo) {
        const { renderAnimation } = await import(
          "../renderers/renderAnimation.js"
        )
        await renderAnimation(this.stage, this, "to", this.#animateTo)
      }

      this.replaceChildren()
      this.remove()
    }

    delete this.stage.component
    delete this.stage.el
    delete this.stage

    this[_lifecycle] = CREATE
  }
}
