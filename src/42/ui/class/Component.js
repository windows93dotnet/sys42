/* eslint-disable complexity */
import render from "../render.js"
import defer from "../../fabric/type/promise/defer.js"
import omit from "../../fabric/type/object/omit.js"
import normalizeDefinition from "../utils/normalizeDefinition.js"
import makeNewContext from "../utils/makeNewContext.js"
import populateContext from "../utils/populateContext.js"
import renderAttributes from "../renderers/renderAttributes.js"
import renderKeyVal from "../renderers/renderKeyVal.js"
import joinScope from "../utils/joinScope.js"
import componentProxy from "../utils/componentProxy.js"
import { toKebabCase } from "../../fabric/type/string/letters.js"
import CONVERTERS from "./Component/CONVERTERS.js"

async function setProps(el, props, _) {
  const { ctx, observed } = el._

  const pending = []

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

    let val

    if (key in el) {
      val = el[key]
    } else if (fromView && el.hasAttribute(attribute)) {
      val = fromView(el.getAttribute(attribute), attribute, el, item)
    } else if (key in _.props) {
      val = _.props[key]
    } else if (ctx.global.state.has(scope)) {
      val = ctx.global.store.get(scope)
    } else if ("default" in item) {
      val = item.default
    }

    let currentVal = val

    let fromRenderer = false

    if (item.state) ctx.global.store.set(scope, val)

    const render = (val) => {
      currentVal = val

      if (item.state) ctx.global.store.set(scope, val)

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
    }

    if (fromView) {
      observed[attribute] = (val) => {
        if (fromRenderer) return
        render(fromView(val, attribute, el, item))
        ctx.global.state.update(scope, val)
      }
    }

    Object.defineProperty(el, key, {
      configurable: true,
      set(val) {
        render(val)
        ctx.global.state.update(scope, val)
      },
      get() {
        return currentVal
      },
    })

    if (item.computed) {
      pending.push({ el, ctx, key, val: item.computed, item, scope, render })
    } else {
      renderKeyVal(
        { el, ctx, key, val, dynamic: item.state },
        (val, key, el, changedScope) => {
          render(val)
          if (!item.state && changedScope && scope !== changedScope) {
            ctx.global.state.updateNow(scope, val)
          }
        }
      )
    }
  }

  await ctx.undones.done()

  for (const { el, ctx, key, val, item, scope, render } of pending) {
    renderKeyVal(
      { el, ctx, key, val, dynamic: item.state },
      (val, key, el, changedScope) => {
        val = componentProxy(val, el)
        render(val)
        if (!item.state && changedScope && scope !== changedScope) {
          ctx.global.state.updateNow(scope, val)
        }

        requestAnimationFrame(() => val[componentProxy.REVOKE]())
      }
    )
  }

  await ctx.undones.done()
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

    let { ctx } = _
    ctx = { ...ctx }
    ctx.global = { ...ctx.global }
    ctx.cancel = ctx.cancel?.fork(this.localName)
    ctx.undones = undefined
    ctx.global.state = undefined
    ctx = makeNewContext(ctx, this)

    this._.ctx = ctx

    if (props) await setProps(this, props, _)
    if (_.attrs) renderAttributes(this, ctx, _.attrs)

    populateContext(ctx, _.def)
    await ctx.undones.done()

    Object.defineProperty(this._, "signal", {
      configurable: true,
      get: () => ctx.cancel.signal,
    })

    let def = await this.prerender?.(this._)
    def ??= omit(_.def, [
      "type",
      "data",
      "schema",
      "computed",
      "filters",
      "actions",
    ])

    // console.log("--- render:", this.localName)
    render(def, ctx, this)

    const undonesTokens = await ctx.undones.done()

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
