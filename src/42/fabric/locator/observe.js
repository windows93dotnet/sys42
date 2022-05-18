/* eslint-disable eqeqeq */
/* eslint-disable complexity */

import equal from "../type/any/equal.js"
import joinScope from "../../ui/utils/joinScope.js"

function escapeDotNotation(key) {
  return key.replaceAll(".", "\\.")
}

const WHILE_LIMIT = 64
const WHILE_LIMIT_ERROR = "Max parent recursion"
export const PROXY_REVOKE = Symbol.for("PROXY_REVOKE")

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
          if (prop === PROXY_REVOKE) return true
          if (typeof prop !== "string") return false

          if (prop.startsWith("@") || prop.startsWith("#")) return true

          if (options?.component && prop in options.component) return true

          if (options?.scopes) {
            let scope = path.join(".")
            if (options.scopes.has(scope)) {
              const component = options.scopes.get(scope)
              if (prop in component) return true
            }

            scope = joinScope(scope, prop)
            if (options.scopes.has(scope)) return true
          }

          if (options?.recursive) {
            if (options?.component) {
              let { parentElement } = options.component
              while (parentElement && prop in parentElement === false) {
                parentElement = parentElement.parentElement
              }

              if (parentElement && prop in parentElement) return true
            }

            let prev = parent
            let i = 0
            while (prev && prop in prev === false) {
              if (i++ > WHILE_LIMIT) throw new Error(WHILE_LIMIT_ERROR)
              prev = proxies.get(prev)?.["@parent"]?.["@target"]
            }

            return prev && prop in prev
          }
        }

        return has
      },

      get(target, prop, receiver) {
        let val = Reflect.get(target, prop, receiver)

        // eslint-disable-next-line no-unreachable-loop
        while (val === undefined) {
          if (prop === Symbol.toStringTag) return "Proxy"
          if (prop === PROXY_REVOKE) return destroy
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

            if (prop === "@root") return proxies.get(root)
            if (prop === "@target") return target

            if (prop === "@parent") {
              return target === parent ? undefined : proxies.get(parent)
            }

            if (prop === "@has") {
              return (prop) => Reflect.has(target, prop, receiver)
            }
          }

          if (options?.component && prop in options.component) {
            val = options.component[prop]
            break
          }

          if (options?.scopes) {
            let scope = path.join(".")
            if (options.scopes.has(scope)) {
              const component = options.scopes.get(scope)
              if (prop in component) {
                val = component[prop]
                // return val
                break
              }
            }

            scope = joinScope(scope, prop)
            if (options.scopes.has(scope)) {
              val = options.scopes.get(scope)
              break
            }
          }

          if (options?.recursive && !Reflect.has(target, prop, receiver)) {
            if (options?.component) {
              let { parentElement } = options.component
              while (parentElement && prop in parentElement === false) {
                parentElement = parentElement.parentElement
              }

              if (parentElement && prop in parentElement) {
                val = parentElement[prop]
                // return val
                break
              }
            }

            let prev = parent
            let i = 0
            while (prev && prop in prev === false) {
              if (i++ > WHILE_LIMIT) throw new Error(WHILE_LIMIT_ERROR)
              prev = proxies.get(prev)?.["@parent"]?.["@target"]
            }

            if (prev && prop in prev) return prev[prop]
          }

          return
        }

        if (
          typeof val === "object" &&
          (val?.constructor === Object || Array.isArray(val))
        ) {
          if (proxies.has(val)) return proxies.get(val)
          const newPath = [...path, escapeDotNotation(prop)]
          const { proxy, revoke } = Proxy.revocable(
            val,
            createHander(newPath, target)
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
          fn([...path, escapeDotNotation(prop)].join("."), val, oldVal)
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

  proxies.set(root, proxy)
  revokes.add(revoke)

  const destroy = () => {
    for (const revoke of revokes) revoke()
    revokes.clear()
  }

  options?.signal.addEventListener("abort", destroy, { once: true })

  return proxy
}

observe.REVOKE = PROXY_REVOKE
