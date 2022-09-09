// @related https://github.com/Rich-Harris/simulant
// @related https://devexpress.github.io/testcafe/documentation/test-api/actions/action-options.html#click-action-options

import Callable from "../../fabric/class/Callable.js"
import defer from "../../fabric/type/promise/defer.js"
import mark from "../../fabric/type/any/mark.js"
import asyncable from "../../fabric/traits/asyncable.js"
import simulate from "../../fabric/event/simulate.js"
import when from "../../fabric/type/promise/when.js"

const { ELEMENT_NODE } = Node

function normalizeTarget(val) {
  const type = typeof val
  const target = type === "string" ? document.querySelector(val) : val
  if (target?.nodeType === ELEMENT_NODE) return target

  if (typeof target?.dispatchEvent !== "function") {
    throw new TypeError(
      `The "target" argument must be an EventTarget or a valid css selector: ${
        type === "string" ? val : type
      }`
    )
  }

  return target
}

export class Puppet extends Callable {
  #instances = []
  #deferred = []
  #pendingKeys = new Map()

  constructor(target, parent = globalThis) {
    super((/* Puppet.query */ ...args) => this.query(...args))

    this.el = normalizeTarget(target)
    this.parent = parent

    asyncable(this, { lazy: true }, async () => this.done())
  }

  get root() {
    let root = this.parent
    while (root?.parent) root = root.parent
    return root
  }

  query(target = globalThis, timeout = 5000) {
    const instance = new Puppet(target, this)
    this.#instances.push(instance)
    if (Number.isFinite(timeout)) setTimeout(() => instance.cleanup(), timeout)
    return instance
  }

  select() {
    this.el.select?.()
    return this
  }

  focus() {
    if ("focus" in this.el) this.el.focus()
    else this.dispatch("focus")
    return this
  }

  input(val) {
    if (val !== undefined && "value" in this.el) this.el.value = val
    this.dispatch("input")
    return this
  }

  click() {
    if ("click" in this.el) this.el.click()
    else this.dispatch("click")
    return this
  }

  dbclick() {
    this.dispatch("dbclick")
    return this
  }

  contextmenu() {
    this.dispatch("contextmenu")
    return this
  }

  keydown(init) {
    this.#pendingKeys.set(mark(init), init)
    this.dispatch("keydown", init)
    return this
  }

  keyup(init) {
    this.#pendingKeys.delete(mark(init))
    this.dispatch("keyup", init)
    return this
  }

  keystroke(init) {
    const deferred = defer()
    this.#deferred.push(deferred)
    this.#pendingKeys.set(mark(init), init)
    this.dispatch("keydown", init)
    setTimeout(() => {
      this.dispatch("keyup", init)
      this.#pendingKeys.delete(mark(init))
      setTimeout(() => deferred.resolve(), 0)
    }, 0)
    return this
  }

  dispatch(event, init = {}) {
    simulate(this.el, event, init)
    const deferred = defer()
    this.#deferred.push(deferred)
    setTimeout(() => deferred.resolve(), 0)
    return this
  }

  async done() {
    this.cleanup()
    return Promise.all(this.#deferred)
  }

  async when(events, options) {
    await this.done()
    await when(this.el, events, options)
  }

  cleanup() {
    for (const pending of this.#pendingKeys.values()) this.keyup(pending)
    for (const instance of this.#instances) instance.cleanup()
    this.#instances.length = 0
    return this
  }
}

export default new Puppet(globalThis)
