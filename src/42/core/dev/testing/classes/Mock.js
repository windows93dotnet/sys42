import Spy from "./Spy.js"
import { isPlainObject } from "../../../../fabric/type/any/is.js"

export default class Mock extends Spy {
  constructor(obj, method, fn) {
    if (typeof obj === "string") {
      fn = method
      method = obj
      obj = globalThis
    }

    if (typeof obj !== "object") {
      throw new TypeError(`mock "object" is not an object`)
    }

    if (method in obj === false) {
      throw new Error(`no "${method}" method in mock "object"`)
    }

    if (obj === globalThis && method === "fetch" && typeof fn !== "function") {
      const cache = Object.fromEntries(
        Object.entries(fn).map(([url, val]) => {
          if (val instanceof Response) return [url, val]

          if (typeof val !== "string" && isPlainObject(val)) {
            try {
              val = JSON.stringify(val)
            } catch {}
          }

          return [url, new Response(val, { url })]
        })
      )

      fn = async (url) => {
        if (url in cache) return cache[url].clone()
        const { origin, pathname } = new URL(url)
        const withoutSearch = `${origin}${pathname}`
        if (withoutSearch in cache) {
          const clone = cache[withoutSearch].clone()
          return clone
        }

        return new Response("", { url, status: 404 })
      }
    }

    super(obj, method, fn)
  }
}
