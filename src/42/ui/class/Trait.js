import ensureElement from "../../fabric/dom/ensureElement.js"

const _INSTANCES = Symbol.for("Trait.INSTANCES")
const _EVENTS = Symbol.for("Emitter.EVENTS")
const { ELEMENT_NODE } = Node

export default class Trait {
  static INSTANCES = _INSTANCES

  constructor(name, el) {
    el = ensureElement(el, {
      fragment: true,
      errorPrefix: `ui.trait.${name}: `,
    })

    el[_INSTANCES] ??= Object.create(null)
    const previous = el[_INSTANCES][name]
    if (previous) previous.destroy()
    el[_INSTANCES][name] = this

    this.el = el
    this.name = name

    this.forgettings = []
  }

  destroy() {
    if (_EVENTS in this) {
      this.emit("destroy")
      this.off("*")
      delete this._EVENTS
    }

    if (this.el && this.el.nodeType === ELEMENT_NODE) {
      delete this.el[_INSTANCES][this.name]
    }

    for (const forget of this.forgettings) forget()
    for (const key of Object.keys(this.forgettings)) {
      this.forgettings[key]()
      delete this.forgettings[key]
    }

    this.forgettings.length = 0
  }
}
