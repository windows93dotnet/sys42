// @thanks https://github.com/jamiebuilds/ninos

import noop from "../../../../fabric/type/function/noop.js"
import Callable from "../../../../fabric/class/Callable.js"

export default class Stub extends Callable {
  constructor(fn = noop, thisArg) {
    const calls = []

    super(function (...args) {
      const call = { args }
      if (thisArg !== false) call.thisArg = thisArg ?? this
      const result = fn.call(call.thisArg, ...args)
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
