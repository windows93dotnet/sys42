// @related https://www.fast.design/docs/fast-element/defining-elements/

import normalizeDefinition from "../utils/normalizeDefinition.js"
import noop from "../../fabric/type/function/noop.js"
import configure from "../../fabric/configure.js"
import makeNewContext from "../utils/makeNewContext.js"
import populateContext from "../utils/populateContext.js"
import shortcuts from "../../system/shortcuts.js"
import Canceller from "../../fabric/class/Canceller.js"
import paintDebounce from "../../fabric/type/function/paintDebounce.js"
import { toKebabCase } from "../../fabric/type/string/letters.js"
import joinScope from "../utils/joinScope.js"
import observe from "../../fabric/locator/observe.js"

import renderAttributes from "../renderers/renderAttributes.js"
import renderKeyVal from "../renderers/renderKeyVal.js"
import { renderTrait, TRAITS } from "../renderers/renderTraits.js"

const DEFAULTS = {
  shadow: false,
  theme: true,
  properties: Object.assign(
    Object.fromEntries(
      TRAITS.map((trait) => [
        trait,
        {
          type: "any",
          fromView: true,
          adapt(el, value) {
            renderTrait(el, trait, value, el._.ctx)
          },
        },
      ])
    ),
    {
      shortcuts: {
        type: "any",
        fromView: true,
        adapt(el, value, oldValue) {
          oldValue?.destroy?.()
          const { ctx } = el._
          return shortcuts(el, value, {
            agent: ctx.global.actions.get(ctx.scope),
            signal: ctx.cancel.signal,
            preventDefault: true,
            serializeArgs: true,
          })
        },
      },
    }
  ),
}

const _INSTANCES = Symbol.for("Trait.INSTANCES")
const _IS_COMPONENT = Symbol.for("Component.IS_COMPONENT")

const DEFAULTS_ATTRIBUTES = Object.keys(DEFAULTS.properties)

const CONVERTERS = {
  string: {
    toView: (val) => String(val),
    fromView: (val) => String(val),
  },
  number: {
    toView: (val) => String(val),
    fromView(val, key) {
      const out = Number(val)
      if (Number.isNaN(out)) {
        throw new TypeError(`"${key}" must be a valid number`)
      }

      return out
    },
  },
  boolean: {
    toView: noop,
    fromView: (val) => (val === "false" ? false : Boolean(val)),
  },
  object: {
    toView: (x) => JSON.stringify(x),
    fromView: (x) => JSON.parse(x),
  },
  tokens: {
    fromView: (val) => String(val).split(" "),
    toView: (val) => val.join(" "),
  },
  any: {
    toView(x) {
      if (typeof x === "string") return x
      try {
        return JSON.stringify(x)
      } catch {
        return x
      }
    },
    fromView(x) {
      try {
        return JSON.parse(x)
      } catch {
        return x
      }
    },
  },
}

CONVERTERS.array = CONVERTERS.object

function normalizeComponentDef(el, args) {
  let { definition } = el.constructor

  definition = configure(DEFAULTS, definition)

  const { properties, defaults } = definition

  const out = normalizeDefinition(definition, ...args)

  out.properties = {}
  out.originals = {}
  out.observed = {}

  out.content = out.def.content ?? []
  out.repeat = out.def.repeat
  out.label = out.def.label

  out.initial = {
    properties: Object.assign(out.props, out.def.traits),
    attributes: out.attrs,
  }

  out.ctx = makeNewContext(out.ctx)

  out.ctx.component = el
  populateContext(out.ctx, out.def)

  out.cancel = out.ctx.cancel?.fork(el.localName) ?? new Canceller(el.localName)
  Object.defineProperty(out, "signal", { get: () => out.cancel.signal })

  out.config = configure(defaults, out.options)

  // define value from content
  // usefull when component is called as a function
  // e.g. picto("puzzle") -> out.content === ["puzzle"] -> el.value === "puzzle"
  if (
    "value" in properties &&
    "value" in out.initial.attributes === false &&
    out.content.length === 1
  ) {
    out.initial.properties.value = out.content[0]
  }

  if (properties) setProperties(properties, out, el)

  return out
}

function setProperties(properties, out, el) {
  const { signal } = out

  for (let [key, item] of Object.entries(properties)) {
    const type = typeof item

    if (type !== "object") {
      item = { type, default: item, reflect: true, render: true }
    }

    const attribute = item.attribute ?? toKebabCase(key)
    const converter = item.converter ?? CONVERTERS[item.type ?? "string"]
    let { fromView, toView, reflect } = item

    if (reflect) {
      fromView = true
      toView = true
    }

    const scope = joinScope(out.ctx.scope, key)

    const assignProp = (item, value) => {
      if (item.adapt) {
        const res = item.adapt(el, value, out.properties[key])
        if (res !== undefined) value = res
      }

      if (
        item.state &&
        out.ctx.global.state &&
        value &&
        typeof value === "object"
      ) {
        out.originals[key] = value
        value = observe(value, { signal }, (path) =>
          out.ctx.global.state.update(joinScope(scope, path))
        )
      }

      out.properties[key] = value === null ? item.default : value

      if (item.css) {
        el.style.setProperty(
          `--${typeof item.css === "string" ? item.css : key}`,
          value
        )
      }

      if (item.state && out.ctx.global.state && el._.render !== noop) {
        out.ctx.global.state.update(scope)
      }
    }

    if (fromView) {
      fromView = typeof fromView === "function" ? fromView : converter.fromView
      out.observed[attribute] = (value) => {
        value = fromView(value, attribute, el)

        if (item.type === "any" && value === "") value = true

        assignProp(item, value)

        if (item.render) el._.repaint()
      }
    }

    if (toView) {
      toView = typeof toView === "function" ? toView : converter.toView
    }

    Object.defineProperty(el, key, {
      configurable: true,
      set(value) {
        assignProp(item, value)

        if (toView) {
          if (
            item.type === "boolean" ||
            (item.type === "any" && typeof value === "boolean")
          ) {
            el.toggleAttribute(attribute, value)
          } else el.setAttribute(attribute, toView(value, key, el))
        } else if (item.render) el._.repaint()
      },
      get() {
        return out.properties[key]
      },
    })

    if (!el.hasAttribute(attribute) && "default" in item) {
      if (toView) out.initial.attributes[key] = item.default
      else out.initial.properties[key] ??= item.default
    } else if (item.type === "boolean" || item.type === "any") {
      out.properties[key] = false
    }
  }
}

export default class Component extends HTMLElement {
  static IS_COMPONENT = _IS_COMPONENT

  static isComponent(el) {
    return el && typeof el === "object" && el[_IS_COMPONENT] === true
  }

  static async define(Class) {
    const tagName = Class.definition.tag ?? `ui-${Class.name.toLowerCase()}`
    if (!customElements.get(tagName)) customElements.define(tagName, Class)
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

  constructor(...args) {
    super()
    this[_IS_COMPONENT] = true
    if (args.length > 0) this.$init(...args)
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (this._?.observed[name]) {
      this._.observed[name](newValue, oldValue)
    }
  }

  connectedCallback() {
    if (!this.isConnected) return

    if (this._) this._.init()
    else if (!this.hasAttribute("data-lazy-init")) this.$init()
  }

  disconnectedCallback() {
    this._?.cancel()

    if (_INSTANCES in this) {
      // Iterate over Trait instances in reverse order
      // to try to restaure originals attributes
      for (const instance of Object.values(this[_INSTANCES]).reverse()) {
        instance.destroy?.()
      }
    }
  }

  // adoptedCallback() {
  //   console.log("adoptedCallback", this.localName)
  // }

  // public methods
  // --------------

  $init(...args) {
    this.removeAttribute("data-lazy-init")
    this._ = normalizeComponentDef(this, args)
    this._.render = noop
    this._.repaint = noop

    if (this.constructor.formAssociated) {
      this._.internals = this.attachInternals()
    }

    const { definition } = this.constructor

    this._.root = definition?.shadow
      ? this.attachShadow({ mode: "open" })
      : this

    if (definition && definition.shadow && definition.theme !== false) {
      const { theme } = definition
      const link = document.createElement("link")
      link.toggleAttribute("data-steady", true)
      link.rel = "stylesheet"
      link.href = typeof theme === "string" ? theme : "/style.css"
      this._.root.append(link)
    }

    this._.init = () => {
      if (this._.initial) {
        const { initial } = this._
        delete this._.initial

        renderAttributes(this, this._.ctx, initial.attributes)
        for (const [key, val] of Object.entries(initial.properties)) {
          renderKeyVal(this, this._.ctx, key, val)
        }

        for (const { name, value } of this.attributes) {
          if (this._.observed[name]) {
            this._.observed[name](value, null)
          }
        }

        // Add element properties as data getter/setter
        const { _ } = this
        const data = _.ctx.global.rack.get(_.ctx.scope)
        if (data && typeof data === "object" && definition.properties) {
          for (const [key, val] of Object.entries(definition.properties)) {
            if (val.state === true) {
              const descriptor = {
                enumerable: true,
                configurable: true,
                get: () => (key in _.originals ? _.originals[key] : this[key]),
                set: (val) => {
                  this[key] = val
                },
              }
              Object.defineProperty(data, key, descriptor)
            }
          }
        }

        this.$create(this._)
      }

      this._.render = () => this.$render(this._)
      this._.repaint = paintDebounce(() => this._.render())

      this._.render()
    }

    if (this.isConnected) this._.init()
  }

  $create() {}

  $render() {}
}
