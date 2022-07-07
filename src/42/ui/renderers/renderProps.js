/* eslint-disable complexity */
import noop from "../../fabric/type/function/noop.js"
import resolveScope from "../resolveScope.js"
import register from "../register.js"
import { normalizeComputed } from "../normalize.js"
import { toKebabCase } from "../../fabric/type/string/letters.js"
import paintThrottle from "../../fabric/type/function/paintThrottle.js"

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
    toView: (val) => val.join(" "),
    fromView: (val) => String(val).split(" "),
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
  let data = {}

  if (ctx.reactive.has(ctx.scope)) {
    data = ctx.reactive.get(ctx.scope)
  } else {
    ctx.reactive.set(ctx.scope, data, { silent: true })
  }

  let queue
  let componentUpdate
  if (el.update) {
    queue = new Set()
    componentUpdate = paintThrottle(() => {
      el.update(queue)
      queue.clear()
    })
  }

  const updates = {}

  for (let [key, item] of Object.entries(props)) {
    const type = typeof item

    if (type !== "object") {
      item = { type, default: item, reflect: true }
    }

    const scope = item.state //
      ? resolveScope(ctx.globalScope, key, ctx)
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

    if (key in data) {
      val = data[key]
    } else if (key in el) {
      val = el[key]
    } else if (fromView && el.hasAttribute(attribute)) {
      val = fromView(el.getAttribute(attribute), attribute, el, item)
    } else if (key in def) {
      val = def[key]
    } else if ("default" in item) {
      val = item.default
    }

    let ref
    let fromRender = false
    let updateFn

    if (item.update) {
      const type = typeof item.update
      if (type === "string" || type === "symbol") {
        updates[item.update] ??= paintThrottle(() => el[item.update]())
        updateFn = updates[item.update]
      } else {
        updateFn =
          type === "function"
            ? () => item.update.call(el, ref ? ctx.reactive.get(ref.$ref) : val)
            : () => {}
      }
    }

    const render = (val, update) => {
      if (ctx.cancel.signal.aborted === true) return

      ctx.reactive.now(() => {
        if (!item.computed) {
          ctx.reactive.set(scope, ref ?? val, { silent: !update })
        }

        if (updateFn && !el.ready.isPending && updateFn() !== false && queue) {
          queue.add(key)
          componentUpdate()
        }
      })

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
        } else {
          const res = toView(val, key, el, item)
          if (typeof res === "boolean") el.toggleAttribute(attribute, res)
          else el.setAttribute(attribute, res)
        }

        fromRender = false
      }
    }

    if (fromView) {
      observed[attribute] = (val) => {
        if (fromRender) return
        render(fromView(val, attribute, el, item), true)
      }
    }

    if (item.computed) {
      let computed

      Object.defineProperty(el, key, {
        configurable: true,
        get: () => computed,
      })

      normalizeComputed(scope, item.computed, ctx, (val) => {
        computed = val
        render(val)
      })

      continue
    }

    Object.defineProperty(el, key, {
      configurable: true,
      set(val) {
        if (ref) ctx.reactive.now(() => ctx.reactive.set(ref.$ref, val))
        else render(val, true)
      },
      get() {
        return ctx.reactive.get(ref ? ref.$ref : scope)
      },
    })

    if (typeof val === "function") {
      const fn = val
      ref = fn.ref ? { $ref: fn.ref } : undefined
      register(ctx, fn, (val, changed) => render(val, changed !== scope))
    } else {
      render(val)
      if (!item.state) continue
      register(ctx, scope, (val, changed) => render(val, changed !== scope))
    }
  }

  await ctx.undones.done()

  for (const key of Reflect.ownKeys(updates)) updates[key]()

  return observed
}
