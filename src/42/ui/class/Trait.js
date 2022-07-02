import Canceller from "../../fabric/class/Canceller.js"
import ensureElement from "../../fabric/dom/ensureElement.js"

const _INSTANCES = Symbol.for("Trait.INSTANCES")
const _EVENTS = Symbol.for("Emitter.EVENTS")
const { ELEMENT_NODE } = Node

export default class Trait {
  static INSTANCES = _INSTANCES

  constructor(el, options) {
    el = ensureElement(el, { fragment: true })

    const { name } = this.constructor

    el[_INSTANCES] ??= Object.create(null)
    const previous = el[_INSTANCES][name]
    if (previous) previous.destroy()
    el[_INSTANCES][name] = this

    this.el = el
    this.cancel = new Canceller(options?.signal)
  }

  destroy() {
    this.cancel()

    if (_EVENTS in this) {
      this.emit("destroy")
      this.off("*")
      delete this._EVENTS
    }

    if (this.el && this.el.nodeType === ELEMENT_NODE) {
      delete this.el[_INSTANCES][this.constructor.name]
    }
  }
}
