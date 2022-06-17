/* eslint-disable complexity */
import noop from "../../fabric/type/function/noop.js"
import resolveScope from "../resolveScope.js"
import register from "../register.js"
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

export default async function renderProps(el) {
  const { ctx, def } = el
  const { props } = def
  const observed = {}

  if (!ctx.state.has(ctx.scope)) {
    ctx.state.set(ctx.scope, {}, { silent: true })
  }

  for (let [key, item] of Object.entries(props)) {
    const type = typeof item

    if (type !== "object") {
      item = { type, default: item, reflect: true }
    }

    const scope = item.state //
      ? resolveScope(ctx.stateScope, key, ctx)
      : resolveScope(ctx.scope, key, ctx)

    const attribute = item.attribute ?? toKebabCase(key)
    const converter = item.converter ?? CONVERTERS[item.type ?? "string"]
    let { fromView, toView, reflect } = item

    if (reflect) {
      fromView ??= true
      toView ??= true
    }

    if (fromView) {
      fromView = typeof fromView === "function" ? fromView : converter.fromView
    }

    if (toView) {
      toView = typeof toView === "function" ? toView : converter.toView
    }

    let val

    if (key in el) {
      val = el[key]
    } else if (fromView && el.hasAttribute(attribute)) {
      val = fromView(el.getAttribute(attribute), attribute, el, item)
    } else if (def && key in def) {
      val = def[key]
    } else if ("default" in item) {
      val = item.default
    }

    let ref
    let fromRender = false

    const render = (val, update) => {
      if (ctx.cancel.signal.aborted === true) return

      ctx.state.now(() => ctx.state.set(scope, ref ?? val, { silent: !update }))

      if (item.css) {
        const cssVar = `--${typeof item.css === "string" ? item.css : key}`
        if (val == null) el.style.removeProperty(cssVar)
        else el.style.setProperty(cssVar, val)
      }

      if (toView) {
        fromRender = true
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
        fromRender = false
      }
    }

    if (fromView) {
      observed[attribute] = (val) => {
        if (fromRender) return
        render(fromView(val, attribute, el, item), true)
      }
    }

    Object.defineProperty(el, key, {
      configurable: true,
      set(val) {
        if (ref) ctx.state.now(() => ctx.state.set(ref.$ref, val))
        else render(val, true)
      },
      get() {
        return ctx.state.get(ref ? ref.$ref : scope)
      },
    })

    if (typeof val === "function") {
      const fn = val
      ref =
        !fn.hasFilter && fn.scopes.length === 1 && fn.scopes[0] !== scope
          ? { $ref: fn.scopes[0] }
          : undefined
      register(ctx, fn, (val, changed) => render(val, changed !== scope))
    } else {
      render(val)
      if (!item.state) continue
      register(ctx, scope, (val, changed) => render(val, changed !== scope))
    }
  }

  await ctx.undones.done()

  return observed
}
