import noop from "../../fabric/type/function/noop.js"
import resolve from "../resolve.js"
import register from "../register.js"
import allocate from "../../fabric/locator/allocate.js"
import { toKebabCase } from "../../fabric/type/string/letters.js"

const BOOLEAN_TRUE = new Set(["", "on", "true"])
const BOOLEAN_FALSE = new Set(["none", "off", "false"])

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
    fromView(val) {
      if (BOOLEAN_TRUE.has(val)) return true
      if (BOOLEAN_FALSE.has(val)) return false
      return Boolean(val)
    },
  },
  object: {
    toView: (val) => JSON.stringify(val),
    fromView: (val) => JSON.parse(val),
  },
  tokens: {
    fromView: (val) => String(val).split(" "),
    toView: (val) => val.join(" "),
  },
  any: {
    toView(val) {
      if (typeof val === "string") return val
      try {
        return JSON.stringify(val)
      } catch {
        return val
      }
    },
    fromView(val) {
      if (BOOLEAN_TRUE.has(val)) return true
      if (BOOLEAN_FALSE.has(val)) return false
      try {
        return JSON.parse(val)
      } catch {
        return val
      }
    },
  },
}

CONVERTERS.array = CONVERTERS.object

export default async function renderProps(el, props, def) {
  const { ctx } = el
  const observed = {}

  for (let [key, item] of Object.entries(props)) {
    const scope = resolve(ctx.scope, key)

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
    } else if (def && key in def) {
      val = def[key]
    } else if (ctx.state.has(scope)) {
      val = ctx.state.get(scope)
    } else if ("default" in item) {
      val = item.default
    }

    if (item.state) ctx.state.set(scope, val)

    let fromRenderer = false
    const render = (arg) => {
      val = arg

      if (item.state) allocate(ctx.state.value, scope, val)

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
        ctx.state.update(scope, val)
      }
    }

    Object.defineProperty(el, key, {
      configurable: true,
      set(val) {
        render(val)
        ctx.state.update(scope, val)
      },
      get() {
        return val
      },
    })

    register(ctx, scope, render)
  }

  return observed
}
