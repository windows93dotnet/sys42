import Canceller from "../../fabric/class/Canceller.js"
import ensureElement from "../../fabric/dom/ensureElement.js"

const _INSTANCES = Symbol.for("Trait.INSTANCES")
const _EVENTS = Symbol.for("Emitter.EVENTS")
const _isComponent = Symbol.for("Component.isComponent")
const { ELEMENT_NODE } = Node

export default class Trait {
  static INSTANCES = _INSTANCES

  #hasGetter = false

  constructor(el, options) {
    el = ensureElement(el)

    const name = options?.name ?? this.constructor.name.toLowerCase()

    el[_INSTANCES] ??= Object.create(null)
    const previous = el[_INSTANCES][name]
    if (previous) previous.destroy()
    el[_INSTANCES][name] = this

    if (el[_isComponent] && name in el) {
      this.#hasGetter = true
      Object.defineProperty(el, name, {
        get: () => this,
      })
    }

    this.el = el
    this.name = name
    this.cancel = new Canceller()

    options?.signal.addEventListener("abort", () => this.destroy())
  }

  destroy() {
    this.cancel(`${this.constructor.name} destroyed`)

    if (_EVENTS in this) {
      this.emit("destroy", this)
      this.off("*")
      delete this[_EVENTS]
    }

    if (this.el && this.el.nodeType === ELEMENT_NODE) {
      if (this.#hasGetter) delete this.el[this.name]
      delete this.el[_INSTANCES][this.name]
    }
  }
}
