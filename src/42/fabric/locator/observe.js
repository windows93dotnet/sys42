/* eslint-disable eqeqeq */
/* eslint-disable complexity */

import equal from "../type/any/equal.js"

function escapeDotNotation(key) {
  return key.replaceAll(".", "\\.")
}

export default function observe(root, options, fn) {
  if (typeof options === "function") fn = options

  const proxies = new WeakMap()
  const revokes = new Set()

  function createHander(path, parent) {
    return {
      has(target, prop, receiver) {
        const has = Reflect.has(target, prop, receiver)

        if (!has) {
          if (prop === Symbol.toStringTag) return true
          if (prop === observe.REVOKE) return true
          if (typeof prop !== "string") return false

          if (prop.startsWith("@") || prop.startsWith("#")) return true
          if (options?.rootFallback) return prop in root
        }

        return has
      },

      get(target, prop, receiver) {
        let val = Reflect.get(target, prop, receiver)

        if (val === undefined) {
          if (prop === Symbol.toStringTag) return "Proxy"
          if (prop === observe.REVOKE) return destroy
          if (typeof prop !== "string") return

          if (prop.startsWith("#")) {
            return path.at(-1).padStart(prop.length, "0")
          }

          if (prop.startsWith("@")) {
            // @see https://handlebarsjs.com/api-reference/data-variables.html
            if (prop === "@index") return Number(path.at(-1))
            if (prop === "@key") return path.at(-1)
            if (prop === "@first") return path.at(-1) === "0"
            if (prop === "@last") return path.at(-1) == parent.length - 1
            if (prop === "@path") return path.join(".")
            if (prop === "@parent") return proxies.get(parent)
            if (prop === "@root") return proxies.get(root)
            if (prop === "@target") return target
          }

          if (options?.rootFallback && !Reflect.has(target, prop, receiver)) {
            if (prop in root) val = root[prop]
            else if (options?.commons && prop in options.commons) {
              return options.commons[prop]
            } else return
          } else return
        }

        if (
          typeof val === "object" &&
          (val?.constructor === Object || Array.isArray(val))
        ) {
          if (proxies.has(val)) return proxies.get(val)
          const p = [...path, escapeDotNotation(prop)]
          const { proxy, revoke } = Proxy.revocable(
            val,
            createHander(p, target)
          )
          proxies.set(val, proxy)
          revokes.add(revoke)
          return proxy
        }

        return val
      },

      set(target, prop, val, receiver) {
        const oldVal = Reflect.get(target, prop, receiver)
        const ret = Reflect.set(target, prop, val, receiver)

        if (prop === "length" || !equal(val, oldVal)) {
          fn([...path, escapeDotNotation(prop)].join("."), val)
        }

        return ret
      },

      deleteProperty(target, prop) {
        const ret = Reflect.deleteProperty(target, prop)
        fn([...path, escapeDotNotation(prop)].join("."))
        return ret
      },
    }
  }

  const { proxy, revoke } = Proxy.revocable(root, createHander([], root))

  revokes.add(revoke)

  const destroy = () => {
    for (const revoke of revokes) revoke()
    revokes.clear()
  }

  options?.signal.addEventListener("abort", destroy, { once: true })

  return proxy
}

observe.REVOKE = Symbol.for("observe.REVOKE")
