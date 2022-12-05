export default function observe(root, options = {}) {
  const revokes = new Set()
  const proxies = new WeakMap()

  let targets
  if (options.setProxyAsTarget !== false) {
    targets = new WeakMap()
  }

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
          return Reflect.has(target, key, receiver)
            ? undefined
            : options.get?.(scope + key, { key, chain, parent, root })
        }

        if (
          val &&
          typeof key === "string" &&
          typeof val === "object" &&
          (val.constructor === Object ||
            Array.isArray(val) ||
            val[Symbol.for("observe")] === true)
        ) {
          if (options.locate && "$ref" in val) return options.locate(val.$ref)
          if (proxies.has(val)) return proxies.get(val)
          const { proxy, revoke } = Proxy.revocable(
            val,
            handler([...chain, key], target)
          )
          proxies.set(val, proxy)
          if (options.setProxyAsTarget !== false) targets.set(proxy, val)
          revokes.add(revoke)
          return proxy
        }

        return val
      },

      set(target, key, val, receiver) {
        let res

        if (typeof key === "string") {
          const oldVal = Reflect.get(target, key, receiver)
          const path = scope + key

          if (options.setProxyAsTarget !== false && targets.has(val)) {
            val = targets.get(val)
          }

          const allow = options.set?.(path, val, oldVal, {
            key,
            chain,
            parent,
            root,
          })
          res = (allow ?? true) && Reflect.set(target, key, val, receiver)
          options.change?.(path, val, oldVal)
        } else {
          res = Reflect.set(target, key, val, receiver)
        }

        return res
      },

      deleteProperty(target, key, receiver) {
        let res

        if (typeof key === "string") {
          const oldVal = Reflect.get(target, key, receiver)
          const path = scope + key
          const allow = options.delete?.(path, oldVal, {
            key,
            chain,
            parent,
            root,
          })
          res = (allow ?? true) && Reflect.deleteProperty(target, key)
          options.change?.(path, undefined, oldVal, true)
        } else {
          res = Reflect.deleteProperty(target, key)
        }

        return res
      },
    }
  }

  const { proxy, revoke } = Proxy.revocable(root, handler([], root))
  proxies.set(root, proxy)
  if (options.setProxyAsTarget !== false) targets.set(proxy, root)
  revokes.add(revoke)

  const destroy = () => {
    for (const revoke of revokes) revoke()
    revokes.clear()
  }

  options.signal?.addEventListener("abort", destroy)

  return proxy
}
