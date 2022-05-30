export const PROXY_REVOKE = Symbol.for("PROXY_REVOKE")

export default function observe(root, options = {}) {
  const proxies = new WeakMap()
  const revokes = new Set()

  function handler(parents) {
    const scope = "/" + (parents.length > 0 ? parents.join("/") + "/" : "")

    return {
      has(target, key, receiver) {
        const has = Reflect.has(target, key, receiver)

        if (!has) {
          if (key === PROXY_REVOKE) return true
          return options.has?.(target, key, parents) ?? false
        }

        return has
      },

      get(target, key, receiver) {
        const val = Reflect.get(target, key, receiver)

        if (val === undefined) {
          if (key === PROXY_REVOKE) return revoke
          if (typeof key !== "string") return
          return options.get?.(scope + key)
        }

        if (
          typeof val === "object" &&
          (val?.constructor === Object || Array.isArray(val))
        ) {
          if (proxies.has(val)) return proxies.get(val)
          const { proxy, revoke } = Proxy.revocable(
            val,
            handler([...parents, key])
          )
          proxies.set(val, proxy)
          revokes.add(revoke)
          return proxy
        }

        return val
      },

      set(target, key, val, receiver) {
        const oldVal = Reflect.get(target, key, receiver)

        let out

        if (typeof key === "string") {
          const allow = options.set
            ? options.set(scope + key, val, oldVal)
            : true
          out = allow && Reflect.set(target, key, val, receiver)
          options.change?.(scope + key, val, oldVal)
        } else {
          out = Reflect.set(target, key, val, receiver)
        }

        return out
      },

      deleteProperty(target, key) {
        let out

        if (typeof key === "string") {
          const allow = options.delete ? options.delete(scope + key) : true
          out = allow && Reflect.deleteProperty(target, key)
          options.change?.(scope + key)
        } else {
          out = Reflect.deleteProperty(target, key)
        }

        return out
      },
    }
  }

  const { proxy, revoke } = Proxy.revocable(root, handler([]))

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
