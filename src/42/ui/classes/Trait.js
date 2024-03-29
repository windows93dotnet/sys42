import isHashmapLike from "../../fabric/type/any/is/isHashmapLike.js"
import Canceller from "../../fabric/classes/Canceller.js"
import ensureElement from "../../fabric/dom/ensureElement.js"

const { ELEMENT_NODE } = Node

const _EVENTS = Symbol.for("Emitter.EVENTS")
const _INSTANCES = Symbol.for("Trait.INSTANCES")
const _isTrait = Symbol.for("Trait.isTrait")

export default class Trait {
  [_isTrait] = true

  static isTrait(val) {
    return Boolean(val?.[_isTrait])
  }

  static INSTANCES = _INSTANCES

  constructor(el, options) {
    if (isHashmapLike(el)) {
      options = el
      el = undefined
    }

    el = ensureElement(options?.element ?? el)

    const name = options?.name ?? this.constructor.name.toLowerCase()

    el[_INSTANCES] ??= {}
    const previous = el[_INSTANCES][name]
    if (previous) previous.destroy()
    el[_INSTANCES][name] = this

    this.el = el
    this.name = name
    this.cancel = new Canceller()

    options?.signal?.addEventListener("abort", () => this.destroy())
  }

  destroy() {
    this.cancel(`${this.name} destroyed`)

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
