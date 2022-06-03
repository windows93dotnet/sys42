export default function observe(root, options = {}) {
  const proxies = new WeakMap()
  const revokes = new Set()

  const handler = (chain, parent) => {
    const scope = "/" + (chain.length > 0 ? chain.join("/") + "/" : "")

    return {
      has(target, key, receiver) {
        const has = Reflect.has(target, key, receiver)

        if (!has) {
          if (typeof key !== "string") return false
          return (
            options.has?.(scope + key, { key, chain, parent, root }) ?? false
          )
        }

        return has
      },

      get(target, key, receiver) {
        const val = Reflect.get(target, key, receiver)

        if (val === undefined) {
          if (typeof key !== "string") return
          return options.get?.(scope + key, { key, chain, parent, root })
        }

        if (
          typeof val === "object" &&
          (val?.constructor === Object || Array.isArray(val))
        ) {
          if (proxies.has(val)) return proxies.get(val)
          const { proxy, revoke } = Proxy.revocable(
            val,
            handler([...chain, key], target)
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
          const path = scope + key
          const allow =
            options.set?.(path, val, oldVal, { key, chain, parent, root }) ??
            true
          out = allow && Reflect.set(target, key, val, receiver)
          options.change?.(path, val, oldVal)
        } else {
          out = Reflect.set(target, key, val, receiver)
        }

        return out
      },

      deleteProperty(target, key) {
        let out

        if (typeof key === "string") {
          const path = scope + key
          const allow =
            options.delete?.(path, { key, chain, parent, root }) ?? true
          out = allow && Reflect.deleteProperty(target, key)
          options.change?.(path)
        } else {
          out = Reflect.deleteProperty(target, key)
        }

        return out
      },
    }
  }

  const { proxy, revoke } = Proxy.revocable(root, handler([], root))
  proxies.set(root, proxy)
  revokes.add(revoke)

  const destroy = () => {
    for (const revoke of revokes) revoke()
    revokes.clear()
  }

  options.signal?.addEventListener("abort", destroy, { once: true })

  return proxy
}
