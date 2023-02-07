import Trait from "../classes/Trait.js"
import settings from "../../core/settings.js"

const DEFAULTS = {}

const configure = settings("ui.trait.loopable", DEFAULTS)

class Loopable extends Trait {
  constructor(el, options) {
    super(el, options)

    this.config = configure(options)
  }
}

export function loopable(...args) {
  return new Loopable(...args)
}

export default loopable
