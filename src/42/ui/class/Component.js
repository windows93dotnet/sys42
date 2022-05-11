import render from "../render.js"
import defer from "../../fabric/type/promise/defer.js"
import Undones from "../../fabric/class/Undones.js"
import omit from "../../fabric/type/object/omit.js"
import normalizeDefinition from "../utils/normalizeDefinition.js"
import makeNewContext from "../utils/makeNewContext.js"
import populateContext from "../utils/populateContext.js"
import renderAttributes from "../renderers/renderAttributes.js"
import renderKeyVal from "../renderers/renderKeyVal.js"
import joinScope from "../utils/joinScope.js"
import { toKebabCase } from "../../fabric/type/string/letters.js"
import CONVERTERS from "./Component/CONVERTERS.js"

function setProps(el, props, _) {
  const { ctx, observed } = el._

  for (let [key, item] of Object.entries(props)) {
    const scope = joinScope(ctx.scope, key)

    const type = typeof item

    if (type !== "object") {
      item = { type, default: item, reflect: true }
    }

    const attribute = item.attribute ?? toKebabCase(key)
    const converter = item.converter ?? CONVERTERS[item.type ?? "string"]
    let { fromView, toView, reflect } = item

    if (reflect) {
      fromView = true
      toView = true
    }

    if (toView) {
      toView = typeof toView === "function" ? toView : converter.toView
    }

    if (fromView) {
      fromView = typeof fromView === "function" ? fromView : converter.fromView
    }

    let initialValue

    if (key in el) {
      initialValue = el[key]
    } else if (fromView && el.hasAttribute(attribute)) {
      initialValue = fromView(el.getAttribute(attribute), attribute, el, item)
    } else if (key in _.props) {
      initialValue = _.props[key]
    } else if (ctx.global.state.has(scope)) {
      initialValue = ctx.global.rack.get(scope)
    } else if ("default" in item) {
      initialValue = item.default
    }

    let currentValue = initialValue

    let fromRenderer = false

    if (fromView) {
      observed[attribute] = (val) => {
        if (fromRenderer) return
        ctx.global.state.set(scope, fromView(val, attribute, el, item))
      }
    }

    renderKeyVal(el, ctx, key, initialValue, true, (val) => {
      currentValue = val

      if (item.css) {
        const cssVar = `--${typeof item.css === "string" ? item.css : key}`
        if (val == null) el.style.removeProperty(cssVar)
        else el.style.setProperty(cssVar, val)
      }

      if (toView) {
        fromRenderer = true
        if (val == null) {
          el.removeAttribute(attribute)
        } else if (
          item.type === "boolean" ||
          (item.type === "any" && typeof val === "boolean")
        ) {
          if (item.default === true && val === false) {
            el.setAttribute(attribute, "false")
          } else el.toggleAttribute(attribute, val)
        } else el.setAttribute(attribute, toView(val, key, el, item))
        fromRenderer = false
      }
    })

    Object.defineProperty(el, key, {
      configurable: true,
      set(val) {
        ctx.global.state.set(scope, val)
      },
      get() {
        return currentValue
      },
    })
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

  static get observedAttributes() {
    const observed = []
    if (!this.definition?.props) return observed
    for (const [key, item] of Object.entries(this.definition.props)) {
      observed.push(item.attribute ?? toKebabCase(key))
    }

    return observed
  }

  _ = {}
  #rendered = false

  constructor(...args) {
    super()
    this.ready = defer()
    if (args.length > 0) this.init(...args)
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this._?.observed?.[name]?.(newValue, oldValue)
  }

  connectedCallback() {
    if (!this.isConnected) return
    if (!this.#rendered && !this.hasAttribute("data-lazy-init")) {
      this.init()
    }
  }

  disconnectedCallback() {
    this._?.ctx.cancel()
    this.ready = defer()
    this.#rendered = false
  }

  async #init(...args) {
    this.removeAttribute("data-lazy-init")
    const { definition } = this.constructor
    const { props } = definition

    const _ = normalizeDefinition(definition, ...args)

    _.def.component = this
    this._.observed = {}
    this._.ctx = makeNewContext(_.ctx)
    populateContext(this._.ctx, _.def)
    this._.ctx.undones = new Undones()
    this._.ctx.cancel = this._.ctx.cancel?.fork(this.localName)
    Object.defineProperty(this._, "signal", {
      configurable: true,
      get: () => this._.ctx.cancel.signal,
    })

    if (props) setProps(this, props, _)

    if (_.attrs) renderAttributes(this, this._.ctx, _.attrs)

    const def = this.prerender
      ? await this.prerender?.(this._)
      : omit(_.def, ["type", "data", "schema"])

    await this._.ctx.undones
    this._.ctx.undones.length = 0

    if (def) render(def, this._.ctx, this)
    const undonesTokens = await this._.ctx.undones

    await this.postrender?.(this._)
    this.#rendered = true
    return [`component ${this.localName}`, ...undonesTokens]
  }

  async init(...args) {
    await this.#init(...args)
      .then((tokens) => this.ready.resolve(tokens))
      .catch((err) => this.ready.reject(err))
  }
}
