export const PROXY_REVOKE = Symbol.for("PROXY_REVOKE")

export default function componentProxy(val, cpn) {
  const { proxy, revoke } = Proxy.revocable(val, {
    has(target, prop, receiver) {
      const has = Reflect.has(target, prop, receiver)
      if (!has) {
        if (prop === PROXY_REVOKE) return true
        if (prop in cpn) return true
      }

      return has
    },
    get(target, prop, receiver) {
      if (prop === "then") return (resolve) => resolve(target.toString())
      const has = Reflect.has(target, prop, receiver)
      if (!has) {
        if (prop === PROXY_REVOKE) return revoke
        if (prop in cpn) return cpn[prop]
      }

      return Reflect.get(target, prop, receiver)
    },
  })

  return proxy
}

componentProxy.REVOKE = PROXY_REVOKE
