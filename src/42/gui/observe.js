export const PROXY_REVOKE = Symbol.for("PROXY_REVOKE")

export default function observe(val, options = {}) {
  const { proxy, revoke } = Proxy.revocable(val, {
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

      return val
    },
    set(target, prop, val, receiver) {
      const oldVal = Reflect.get(target, prop, receiver)
      const ret = Reflect.set(target, prop, val, receiver)
      if (options.change) options.change(prop, val, oldVal)
      return ret
    },
  })

  return proxy
}

observe.REVOKE = PROXY_REVOKE
