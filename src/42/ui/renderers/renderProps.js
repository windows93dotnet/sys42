/* eslint-disable complexity */
import noop from "../../fabric/type/function/noop.js"
import resolveScope from "../resolveScope.js"
import register from "../register.js"
import { normalizeComputed } from "../normalize.js"
import toKebabCase from "../../fabric/type/string/case/toKebabCase.js"
import repaintThrottle from "../../fabric/type/function/repaintThrottle.js"
import getType from "../../fabric/type/any/getType.js"

const BOOLEAN_TRUE = new Set(["", "on", "true"])
const BOOLEAN_FALSE = new Set(["none", "off", "false"])

const CONVERTERS = {
  string: {
    toView: String,
    fromView: String,
  },

  number: {
    toView: String,
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

  // TODO: implement TokenList ? https://stackoverflow.com/a/29656169
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

export default async function renderProps(el, props, plan) {
  const { stage } = el

  const observed = {}
  let data

  if (stage.reactive.has(stage.scope)) {
    // TODO: check why ui-picto has undefined state
    data = stage.reactive.get(stage.scope, { silent: true }) ?? {}
  } else {
    data = {}
    stage.reactive.set(stage.scope, data, { silent: true })
  }

  let queue
  let componentUpdate
  if (el.update) {
    queue = new Set()
    componentUpdate = repaintThrottle(() => {
      if (!stage.signal.aborted) el.update(queue)
      queue.clear()
    })
  }

  const updates = {}

  for (let [key, item] of Object.entries(props)) {
    let currentValue
    let ref
    let update
    let fromRender = false
    let fromWrite = false

    const type = getType(item)

    if (type !== "object") item = { type, default: item }
    item.type ??= "default" in item ? typeof item.default : "string"

    const scope =
      item.storeInRootState === true //
        ? resolveScope(stage.scopeChain.at(0)?.scope ?? stage.scope, key, stage)
        : resolveScope(stage.scope, key, stage)

    const attribute = item.attribute ?? toKebabCase(key)
    const converter = item.converter ?? CONVERTERS[item.type]
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

    if (key in data) {
      currentValue = data[key]
    } else if (key in el) {
      currentValue = el[key]
    } else if (fromView && el.hasAttribute(attribute)) {
      currentValue = fromView(el.getAttribute(attribute), attribute, el, item)
    } else if (key in plan) {
      currentValue = plan[key]
    } else if ("default" in item) {
      currentValue = item.default
    }

    if (item.update) {
      const type = typeof item.update
      if (type === "string" || type === "symbol") {
        updates[item.update] ??= repaintThrottle((init) => {
          if (stage.signal.aborted) return
          el[item.update](init)
        })
        update = updates[item.update]
      } else if (type === "function") {
        updates[key] = (init) => item.update.call(el, init)
        update = updates[key]
      }
    }

    const write = (val, options) => {
      if (stage.cancel.signal.aborted === true) return
      if (item.storeInState === false) {
        currentValue = val
        return
      }

      const silent = options?.silent ?? false
      fromWrite = true

      stage.reactive.set(scope, ref ?? val, { silent })
      if (silent) fromWrite = false
    }

    const render = (val) => {
      if (stage.cancel.signal.aborted === true) return

      if (!el.ready.isPending && update?.(false) !== false && queue) {
        queue.add(key)
        componentUpdate()
      }

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
          el.toggleAttribute(attribute, val)
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
        val = fromView(val, attribute, el, item)
        write(val)
        render(val)
      }
    }

    if (item.computed) {
      let computed

      Object.defineProperty(el, key, {
        configurable: true,
        get: () => computed,
      })

      normalizeComputed(scope, item.computed, stage, (val) => {
        computed = val
        render(val)
      })

      continue
    }

    if (typeof currentValue === "function") {
      const fn = currentValue
      currentValue = undefined
      ref = fn.ref ? { $ref: fn.ref } : undefined
      if (fn.ref) stage.refs[scope] = fn.ref

      register(stage, fn, (val, changed) => {
        if (changed !== scope) write(val)
        render(val)
      })
    } else {
      if (item.type === "boolean") currentValue = Boolean(currentValue)
      write(currentValue, { silent: true })
      register(stage, scope, (val, changed) => {
        if (changed !== undefined && changed !== scope) write(val)
        else if (fromWrite) {
          fromWrite = false
          return
        }

        render(val)
      })
    }

    Object.defineProperty(el, key, {
      configurable: true,
      set:
        item.storeInState === false
          ? (val) => {
              currentValue = val
              render(val)
            }
          : (val) => {
              if (ref) stage.reactive.set(ref.$ref, val)
              else {
                write(val)
                render(val)
              }
            },
      get:
        item.storeInState === false
          ? () => currentValue
          : () => stage.reactive.get(ref ? ref.$ref : scope),
    })
  }

  await stage.waitlistPending.done()

  el.ready.then(() => {
    for (const key of Reflect.ownKeys(updates)) updates[key](true)
  })

  return observed
}
