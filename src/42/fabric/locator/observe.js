import equal from "../type/any/equal.js"

function escapeDotNotation(key) {
  return key.replaceAll(".", "\\.")
}

export default function observe(data, options, fn) {
  if (typeof options === "function") fn = options

  const proxies = new WeakMap()
  const revokes = new Set()

  function createHander(path = []) {
    return {
      has(target, prop, receiver) {
        const has = Reflect.has(target, prop, receiver)
        if (!has && options?.rootFallback) return prop in data
        return has
      },

      get(target, prop, receiver) {
        if (prop === Symbol.toStringTag) return "[object Proxy]"
        if (prop === observe.REVOKE) return destroy

        let val = Reflect.get(target, prop, receiver)

        if (val === undefined) {
          console.log(prop)
          if (prop === "@index") return "INDEX"

          if (options?.rootFallback && !Reflect.has(target, prop, receiver)) {
            if (prop in data) val = data[prop]
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
          const { proxy, revoke } = Proxy.revocable(val, createHander(p))
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

  const { proxy, revoke } = Proxy.revocable(data, createHander())

  revokes.add(revoke)

  const destroy = () => {
    for (const revoke of revokes) revoke()
    revokes.clear()
  }

  options?.signal.addEventListener("abort", destroy, { once: true })

  return proxy
}

observe.REVOKE = Symbol.for("observe.REVOKE")
