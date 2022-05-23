import resolvePath from "../fabric/type/path/core/resolvePath.js"

export const PROXY_REVOKE = Symbol.for("PROXY_REVOKE")

export default function observe(root, options = {}) {
  const proxies = new WeakMap()
  const revokes = new Set()

  function createHander(path /* , parent */) {
    return {
      has(target, prop, receiver) {
        const has = Reflect.has(target, prop, receiver)

        if (!has) {
          if (prop === PROXY_REVOKE) return true
          if (options.has) return options.has(target, prop, receiver)
        }

        return has
      },

      get(target, prop, receiver) {
        const val = Reflect.get(target, prop, receiver)

        if (val === undefined) {
          if (prop === "then") return (resolve) => resolve(target)
          if (prop === PROXY_REVOKE) return revoke
          if (options.get) return options.get(target, prop, receiver)
        }

        if (
          typeof val === "object" &&
          (val?.constructor === Object || Array.isArray(val))
        ) {
          if (proxies.has(val)) return proxies.get(val)
          const newPath = [...path, prop]
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
        if (options.change) {
          options.change(resolvePath(path.join("/"), prop), val, oldVal)
        }

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

  options?.signal?.addEventListener("abort", destroy, { once: true })

  return proxy
}

observe.REVOKE = PROXY_REVOKE
