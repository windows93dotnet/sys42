// @thanks https://github.com/jamiebuilds/ninos

import noop from "../../../../fabric/type/function/noop.js"
import Callable from "../../../../fabric/classes/Callable.js"

export default class Stub extends Callable {
  constructor(fn = noop, thisArg) {
    const calls = []

    super(function (...args) {
      const call = { args }

      const that = thisArg === false ? this : thisArg ?? this
      if (thisArg !== false && that !== undefined) call.thisArg = that

      const result = fn.call(that, ...args)
      if (result !== undefined) call.result = result
      calls.push(call)
      return result
    })

    this.fn = fn
    this.calls = calls

    Object.defineProperty(this, "count", { get: () => this.calls.length })
    Object.defineProperty(this, "name", { get: () => fn.name })
  }
}
