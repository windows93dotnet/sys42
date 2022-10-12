/* eslint-disable no-constructor-return */

// thanks: https://stackoverflow.com/a/36871498

export default class Callable extends Function {
  constructor(fn, name = fn.name) {
    const out = Object.setPrototypeOf(fn, new.target.prototype)
    if (name) Object.defineProperty(out, "name", { value: name })
    return out
  }
}
