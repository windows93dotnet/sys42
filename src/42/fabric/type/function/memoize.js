// @thanks https://www.30secondsofcode.org/js/s/memoize
// @thanks https://github.com/caiogondim/fast-memoize.js
// @related https://github.com/medikoo/memoizee

import LRU from "../../classes/LRU.js"
import Callable from "../../classes/Callable.js"
import mark from "../any/mark.js"
import sdbm from "../string/sdbm.js"

const DEFAULTS = {
  max: 32,
  cache: LRU,
  mark: (...args) => (args.length > 0 ? mark(args) : mark(args[0])),
}

class Memoizer extends Callable {
  constructor(fn, options = {}) {
    super((...args) => {
      this.originalFn = fn

      let key = this.config.mark(...args)
      if (key.length > 512) key = sdbm(key)
      if (this.cache.has(key) === false) {
        const out = fn(...args)
        this.cache.set(key, out)
        return out
      }

      return this.cache.get(key)
    })

    this.config = { ...DEFAULTS, ...options }

    this.cache = this.config.max
      ? new this.config.cache(this.config.max)
      : typeof options.cache === "function"
        ? new this.config.cache()
        : new Map()
  }
}

export function memoize(fn, options) {
  return new Memoizer(fn, options)
}

export default memoize
