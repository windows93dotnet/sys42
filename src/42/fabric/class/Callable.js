/* eslint-disable no-constructor-return */

// thanks: https://stackoverflow.com/a/36871498

export default class Callable extends Function {
  constructor(fn) {
    return Object.setPrototypeOf(fn, new.target.prototype)
  }
}
