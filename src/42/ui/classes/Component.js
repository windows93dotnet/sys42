/* eslint-disable complexity */
// @read https://developer.salesforce.com/blogs/2020/01/accessibility-for-web-components
// @read https://github.com/webcomponents/gold-standard/wiki

import {
  addEntry,
  ensurePlan,
  objectifyPlan,
  normalizePlan,
  normalizeString,
  normalizeComputeds,
  normalizeScope,
  normalizeData,
  normalizeAttrs,
} from "../normalize.js"
import Stage from "./Stage.js"
import render from "../render.js"
import renderAttributes from "../renderers/renderAttributes.js"
import renderProps from "../renderers/renderProps.js"
import resolveScope from "../utils/resolveScope.js"

import system from "../../system.js"
import configure from "../../core/configure.js"
import uid from "../../core/uid.js"

import toKebabCase from "../../fabric/type/string/case/toKebabCase.js"
import defer from "../../fabric/type/promise/defer.js"
import isEmptyObject from "../../fabric/type/any/is/isEmptyObject.js"
import dispatch from "../../fabric/event/dispatch.js"
import hash from "../../fabric/type/any/hash.js"

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

  [_lifecycle] = CREATE

  #observed
  #animateTo
  #instanceDestroy
  #hasOwnScope
  #clearOwnScope
  #constructorInit

  constructor(...args) {
    super()

    this.ready = defer()
    this.#instanceDestroy = this.destroy
    this.destroy = this.#destroy

    if (this.isRendered()) return

    this.#constructorInit =
      args.length > 0 ||
      (this.parentElement !== null && !this.hasAttribute("data-no-init"))

    if (this.#constructorInit) this.init(...args)
  }

  isRendered() {
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
    if (this.isRendered()) return // a component created using cloneNode(true) should not init itself

    if (this[_lifecycle] === INIT) {
      await this.ready
      this.#setup()
    } else if (this[_lifecycle] === CREATE) {
      await (this.#constructorInit ? this.ready : this.init())
      this.#setup()
    }
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

  #setOwnScope(props) {
    this.#hasOwnScope = true
    this.stage.scopeChain = structuredClone(this.stage.scopeChain)
    this.stage.scopeChain.push({ scope: this.stage.scope, props })
    const i = this.localName.indexOf("-")
    let prefix = this.localName.slice(0, i)
    const suffix = this.localName.slice(i + 1)
    if (prefix === "ui") prefix = "$" + prefix
    this.stage.scope = resolveScope(
      `${prefix}/${suffix}`,
      stepsToHash(this.stage.steps),
    )

    this.#clearOwnScope = () => {
      this.stage.cancel.signal.removeEventListener("abort", this.#clearOwnScope)
      this.#clearOwnScope = undefined

      if (!this.stage.reactive.data) return

      this.stage.reactive.delete(this.stage.scope, { silent: true })

      if (isEmptyObject(this.stage.reactive.data[prefix]?.[suffix])) {
        delete this.stage.reactive.data[prefix][suffix]
      }

      if (isEmptyObject(this.stage.reactive.data[prefix])) {
        delete this.stage.reactive.data[prefix]
      }

      const changes = new Set([this.stage.scope])
      this.stage.reactive.emit("update", changes, changes) // prevent calling $ref renderers
    }

    this.stage.cancel.signal.addEventListener("abort", this.#clearOwnScope)
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
    this.stage = new Stage({
      ...stage,
      el: this,
      component: this,
      refs: undefined,

      waitlistPreload: undefined,
      // waitlistPending: undefined,
      waitlistComponents: undefined,
      waitlistPostrender: undefined,
      waitlistTraits: undefined,

      scopeResolvers: undefined,
      cancel: stage?.cancel?.fork(),
      steps: stage?.steps ?? this.localName,
    })

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
      for (const [key, val] of Object.entries(plan)) {
        if (propsKeys.includes(key)) {
          delete plan[key]
          props[key] =
            typeof val === "string" //
              ? normalizeString(val, this.stage)
              : val
        } else if (configKeys.includes(key)) {
          delete plan[key]
          params[key] = val
        }
      }
    }

    /* handle plan
    ------------- */
    plan = configure(cpnPlan, plan)
    const { computed, state } = plan

    // Set element ID as soon as possible
    if (plan.id) {
      this.id ||= plan.id === true ? uid() : plan.id
      delete plan.id
    }

    delete plan.computed
    delete plan.state
    delete plan.scope
    delete plan.props
    delete plan.tag

    /* apply props
    -------------- */
    if (propsKeys.length > 0) {
      if (filteredPropsKeys.length > 0) {
        this.#setOwnScope(filteredPropsKeys)
      }

      this.#observed = await renderProps(this, configProps, props)
    }

    if (computed) {
      const computedKeys = Object.keys(computed)
      if (this.#hasOwnScope) {
        this.stage.scopeChain.at(-1).props.push(...computedKeys)
      } else {
        this.#setOwnScope([...filteredPropsKeys, ...computedKeys])
      }
    }

    this.config = configure(cpnPlan.defaults, params)

    if (this.render) {
      const renderConfig = { ...this.config }

      // [1] not needed anymore if used in render

      for (const key of propsKeys) {
        Object.defineProperty(renderConfig, key, {
          enumerable: true,
          get: () => {
            if (plan.traits && key in plan.traits) delete plan.traits[key] // [1]
            delete plan[key] // [1]
            return this[key]
          },
        })
      }

      for (const [key, val] of Object.entries(plan)) {
        Object.defineProperty(renderConfig, key, {
          enumerable: true,
          get() {
            if (plan.traits && key in plan.traits) delete plan.traits[key] // [1]
            delete plan[key] // [1]
            return val
          },
        })
      }

      const renderedPlan = objectifyPlan(await this.render(renderConfig))

      if (renderedPlan.tag) {
        const attrs = normalizeAttrs(plan, this.stage, cpnPlan.defaults)
        if (attrs) renderAttributes(this, this.stage, attrs)
        plan = renderedPlan
      } else {
        Object.assign(plan, renderedPlan)
      }
    }

    plan = normalizePlan(plan, this.stage, { skipAttrs: true })

    this.#animateTo = plan.animate?.to

    /* apply state
    -------------- */
    if (state && options?.skipNormalize !== true) {
      normalizeData(state, this.stage, (res, scope, options) => {
        this.stage.reactive.merge(
          this.#hasOwnScope
            ? this.stage.scopeChain.at(0).scope
            : this.stage.scope,
          res,
          options,
        )
      })
    }

    if (computed) normalizeComputeds(computed, this.stage)

    /* apply attrs
    -------------- */
    if (plan.tag) {
      plan.attrs = normalizeAttrs(plan, this.stage)
    } else {
      const attrs = normalizeAttrs(plan, this.stage, cpnPlan.defaults)
      for (const attr of Object.keys(attrs)) delete plan[attr]
      if (attrs) renderAttributes(this, this.stage, attrs)
    }

    if (this.stage.waitlistPreload.length > 0) {
      await this.stage.waitlistPreload.done()
    }

    let traitsPending

    if (plan.traits) {
      for (const [name, value] of Object.entries(plan.traits)) {
        if (!value) continue
        if (
          name in this === false ||
          this.constructor.plan?.props?.[name]?.trait === true
        ) {
          const deferred = defer()
          traitsPending ??= []
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
      }),
    )

    this.prepend(document.createComment("[rendered]"))

    if (traitsPending) {
      this.stage.waitlistTraits.done().then(() => {
        for (const [name, deferred] of traitsPending) {
          const trait = this[_INSTANCES][name]
          deferred.resolve(trait)
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

  async remove() {
    if (this.isConnected && this.#animateTo) {
      const { renderAnimation } = await import(
        "../renderers/renderAnimation.js"
      )
      await renderAnimation(this.stage, this, "to", this.#animateTo)
    }

    this.replaceChildren()
    super.remove()
  }

  async #destroy(options) {
    if (this[_lifecycle] === DESTROY || this[_lifecycle] === CREATE) return
    this[_lifecycle] = DESTROY

    if (this.#instanceDestroy) await this.#instanceDestroy(options)

    const reason = `${this.localName} destroyed`
    this.#clearOwnScope?.()
    this.stage.cancel(reason)

    this.ready.resolve()
    this.ready = undefined
    this.#observed = undefined

    delete this.stage.component
    delete this.stage.el
    delete this.stage

    this[_lifecycle] = CREATE

    if (options?.remove !== false) {
      await this.remove()
    }
  }
}
