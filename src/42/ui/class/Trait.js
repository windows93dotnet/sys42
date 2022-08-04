import Canceller from "../../fabric/class/Canceller.js"
import ensureElement from "../../fabric/dom/ensureElement.js"

const _INSTANCES = Symbol.for("Trait.INSTANCES")
const _EVENTS = Symbol.for("Emitter.EVENTS")
const { ELEMENT_NODE } = Node

export default class Trait {
  static INSTANCES = _INSTANCES

  constructor(el, options) {
    el = ensureElement(el)

    const name = options?.name ?? this.constructor.name.toLowerCase()

    el[_INSTANCES] ??= Object.create(null)
    const previous = el[_INSTANCES][name]
    if (previous) previous.destroy()
    el[_INSTANCES][name] = this

    this.el = el
    this.name = name
    this.cancel = new Canceller(options?.signal)

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
      delete this.el[_INSTANCES][this.name]
    }
  }
}
