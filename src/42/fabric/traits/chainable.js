import Callable from "../classes/Callable.js"
import hashmap from "../type/object/hashmap.js"
import noop from "../type/function/noop.js"

const GETTERS = Symbol.for("chainable.GETTERS")
const METHODS = Symbol.for("chainable.METHODS")
const FUNCTION = Symbol.for("chainable.FUNCTION")
const DEFAULTS = Symbol.for("chainable.DEFAULTS")

// Can't use Object.assign to conserve key order
function merge(entries, defaults) {
  const out = hashmap.fromEntries(entries)
  for (const key in defaults) if (!(key in out)) out[key] = defaults[key]
  return out
}

function makeContext(chainlink, entries, tracker = Object.create(null)) {
  const ctx = Object.defineProperties(Object.create(null), {
    call: {
      get() {
        return (...args) => chainlink[FUNCTION](ctx, ...args)
      },
    },
    data: {
      get() {
        tracker.data = merge(entries, chainlink[DEFAULTS])
        return tracker.data
      },
    },
    proxy: {
      get: () =>
        new Proxy(hashmap.fromEntries(entries), {
          set(target, key, value) {
            entries.push([key, value])
            return Reflect.set(target, key, value)
          },
        }),
    },
  })

  ctx.entries = entries
  ctx.defaults = chainlink[DEFAULTS]
  ctx.fn = chainlink[FUNCTION]
  return ctx
}

export class Chainlink extends Callable {
  constructor(previous, entries) {
    const fn = previous[FUNCTION]
    super((/* Chainlink */ ...args) =>
      fn.call(this, makeContext(this, entries), ...args)
    )
    const descriptors = Object.getOwnPropertyDescriptors(previous)
    for (const key of Reflect.ownKeys(descriptors)) {
      const { writable, value } = descriptors[key]
      if (writable) this[key] = value
    }
  }
}

export default function chainable(...args) {
  const fn = typeof args.at(-1) === "function" ? args.pop() : noop

  const entries = []

  const defaults = Object.create(null)
  const methods = Object.create(null)
  const getters = []

  const methodsEntries = []

  for (const arg of args) {
    if (Array.isArray(arg)) {
      for (const x of arg) getters.push(x)
    } else if (typeof arg === "function") {
      methodsEntries.push([arg.name, arg])
      methods[arg.name] = arg
    } else {
      for (const [key, val] of Object.entries(arg)) {
        const type = typeof val

        if (type === "function") {
          methodsEntries.push([key, val])
          methods[key] = val
          continue
        }

        if (type !== "undefined") defaults[key] = val

        getters.push(key)
      }
    }
  }

  function chain(previous, entries) {
    const chainlink = new Chainlink(previous, entries)

    for (let i = 0, l = getters.length; i < l; i++) {
      const key = getters[i]
      if (key in methods) continue
      Object.defineProperty(chainlink, key, {
        // clone entries and add boolean flag
        get: () => chain(chainlink, [...entries, [key, true]]),
        set(value) {
          for (const entry of entries) {
            if (entry[0] === key) {
              entry[1] = value
              return
            }
          }

          entries.push([key, value])
        },
        enumerable: true,
      })
    }

    for (const [key, method] of methodsEntries) {
      Object.defineProperty(chainlink, key, {
        value(...args) {
          const tracker = Object.create(null)
          const ctx = makeContext(chainlink, [...entries], tracker)
          const res = method(ctx, ...args)

          // If method return undefined it's part of the chain
          return res === undefined
            ? chain(
                chainlink,
                // If data was accessed it replace entries
                tracker.data ? Object.entries(tracker.data) : ctx.entries
              )
            : res
        },
      })
    }

    return chainlink
  }

  return chain(
    {
      [GETTERS]: getters,
      [METHODS]: methods,
      [DEFAULTS]: defaults,
      [FUNCTION]: fn,
    },
    entries
  )
}
