export const PROXY_REVOKE = Symbol.for("PROXY_REVOKE")

export default function observe(root, options = {}) {
  const proxies = new WeakMap()
  const revokes = new Set()

  function createHander(path) {
    const scope = "/" + (path.length > 0 ? path.join("/") + "/" : "")
    return {
      has(target, prop, receiver) {
        const has = Reflect.has(target, prop, receiver)

        if (!has) {
          if (prop === PROXY_REVOKE) return true
          return options.has?.(target, prop, path) ?? false
        }

        return has
      },

      get(target, prop, receiver) {
        const val = Reflect.get(target, prop, receiver)

        if (val === undefined) {
          if (prop === PROXY_REVOKE) return revoke
          return options.get?.(target, prop, path)
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
        const allow = options.set ? options.set(target, prop, path) : true
        const out = allow && Reflect.set(target, prop, val, receiver)
        options.change?.(scope + prop, val, oldVal)
        return out
      },

      deleteProperty(target, prop) {
        const allow = options.delete ? options.delete(target, prop, path) : true
        const ret = allow && Reflect.deleteProperty(target, prop)
        options.change?.(scope + prop)
        return ret
      },
    }
  }

  const { proxy, revoke } = Proxy.revocable(root, createHander([]))

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
