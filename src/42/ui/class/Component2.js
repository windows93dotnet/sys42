import render from "../render.js"
import normalizeDefinition from "../utils/normalizeDefinition.js"
import makeNewContext from "../utils/makeNewContext.js"
import renderAttributes from "../renderers/renderAttributes.js"
import registerRenderer from "../utils/registerRenderer.js"
import joinScope from "../utils/joinScope.js"
import { toKebabCase } from "../../fabric/type/string/letters.js"
import CONVERTERS from "./Component/CONVERTERS.js"

const DEFAULTS = {
  properties: {},
}

const DEFAULTS_ATTRIBUTES = Object.keys(DEFAULTS.properties)

function setProps(el, props, _) {
  const { ctx } = el._

  for (let [key, item] of Object.entries(props)) {
    const type = typeof item

    if (type !== "object") {
      item = { type, default: item, reflect: true }
    }

    if (item.default) _.props[key] ??= item.default

    const attribute = item.attribute ?? toKebabCase(key)
    const converter = item.converter ?? CONVERTERS[item.type ?? "string"]
    let { /* fromView, */ toView, reflect } = item

    if (reflect) {
      // fromView = true
      toView = true
    }

    if (toView) {
      toView = typeof toView === "function" ? toView : converter.toView
    }

    const scope = joinScope(ctx.scope, key)

    ctx.global.state.set(scope, _.props[key])

    if (toView) {
      registerRenderer(ctx, scope, () => {
        const value = ctx.global.rack.get(scope)
        if (
          item.type === "boolean" ||
          (item.type === "any" && typeof value === "boolean")
        ) {
          if (item.default === true && value === false) {
            el.setAttribute(attribute, "false")
          } else el.toggleAttribute(attribute, value)
        } else el.setAttribute(attribute, toView(value, key, el, item))
      })
    }

    Object.defineProperty(el, key, {
      configurable: true,
      set(value) {
        ctx.global.state.set(scope, value)
      },
      get() {
        return ctx.global.state.getProxy(scope)
      },
    })
  }
}

export default class Component extends HTMLElement {
  static async define(Class) {
    const tagName = Class.definition.tag ?? `ui-${Class.name.toLowerCase()}`
    customElements.define(tagName, Class)
    return (...args) => new Class(...args)
  }

  static get observedAttributes() {
    const observed = [...DEFAULTS_ATTRIBUTES]
    if (!this.definition?.properties) return observed
    const { properties } = this.definition

    for (const [key, item] of Object.entries(properties)) {
      observed.push(item.attribute ?? toKebabCase(key))
    }

    return observed
  }

  _ = {}
  #rendered = false

  constructor(...args) {
    super()
    if (args.length > 0) this.$init(...args)
  }

  connectedCallback() {
    if (!this.isConnected) return
    if (!this.#rendered && !this.hasAttribute("data-lazy-init")) {
      this.$init()
    }
  }

  $init(...args) {
    this.removeAttribute("data-lazy-init")
    const { definition } = this.constructor
    const { properties } = definition

    const _ = normalizeDefinition(definition, ...args)

    this._.ctx = makeNewContext(_.ctx)

    if (properties) setProps(this, properties, _)

    if (_.attrs) renderAttributes(this, this._.ctx, _.attrs)

    const def = "$render" in this ? this.$render(this._) : _.def.content
    if (def) render(def, this._.ctx, this)
    this.#rendered = true
  }
}
