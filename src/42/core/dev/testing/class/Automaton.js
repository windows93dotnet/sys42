// @related https://github.com/Rich-Harris/simulant
// @related https://devexpress.github.io/testcafe/documentation/test-api/actions/action-options.html#click-action-options

// import configure from "../../configure.js"
import gamepad, { GamepadEvent } from "../../../devices/gamepad.js"

const DEFAULT_EVENT = {
  bubbles: true,
  cancelable: true,
  composed: true,
}

class FakeEvents {
  constructor(automaton, Event, event) {
    this.automaton = automaton
    this.Event = Event
    this.event = event
    this.pendings = []
  }

  normalize(config) {
    return config
  }

  up(config, cb) {
    const event = new this.Event(this.event.up, ...this.normalize(config, "up"))
    this.automaton.el.dispatchEvent(event)
    if (typeof cb === "function") {
      this.pendings.push(requestAnimationFrame(() => cb(event)))
    }

    return this.automaton
  }

  down(config, cb) {
    const event = new this.Event(
      this.event.down,
      ...this.normalize(config, "down")
    )
    this.automaton.el.dispatchEvent(event)
    if (typeof cb === "function") {
      this.pendings.push(requestAnimationFrame(() => cb(event)))
    }

    return this.automaton
  }

  stroke(config, cb) {
    this.down(config, (downEvent) =>
      this.up(config, (upEvent) => {
        if (typeof cb === "function") {
          this.pendings.push(
            requestAnimationFrame(() => cb(downEvent, upEvent))
          )
        }
      })
    )
    return this.automaton
  }

  cleanup() {
    this.pendings.forEach(cancelAnimationFrame)
    this.pendings.length = 0
    return this.automaton
  }
}

class FakeKeyboard extends FakeEvents {
  constructor(automaton) {
    super(automaton, KeyboardEvent, { up: "keyup", down: "keydown" })
    this.automaton = automaton
    this.pendings = []
  }

  normalize(config) {
    return [
      Object.assign(
        typeof config === "string"
          ? { key: config }
          : Array.isArray(config)
          ? { key: config[0], code: config[1] }
          : config,
        DEFAULT_EVENT
      ),
    ]
  }
}

class FakeGamepad extends FakeEvents {
  constructor(automaton) {
    super(automaton, GamepadEvent, { up: "buttonup", down: "buttondown" })
    this.automaton = automaton
    this.pendings = []
  }

  normalize(config, dir) {
    let n = 0
    let val = 1
    let alias = config
    if (Array.isArray(config)) {
      n = config[0]
      alias = config[1]
      val = config[2]
    }

    const key = `gamepad_${n}_${gamepad.aliases[alias]}`
    const i = key[key.length - 1]
    if (dir === "up") {
      delete gamepad.status[key]
    } else gamepad.status[key] = val
    return [i, val, {}]
  }
}

export default class Automaton {
  constructor(el, options) {
    this.init(el, options)
    this.key = new FakeKeyboard(this)
    this.pad = new FakeGamepad(this)
  }

  init(el, options) {
    this.setElement(el)
    this.setOptions(options)
  }

  setOptions(options) {
    this.config = options
    return this
  }

  setElement(el = document.body) {
    if (typeof el === "string") el = document.querySelector(el)
    this.el = el
    return this
  }

  select(el = this.el) {
    el.select()
    return this
  }

  focus(el = this.el) {
    el.focus()
    return this
  }

  click(el = this.el) {
    el.click()
    return this
  }

  cleanup() {
    this.key.cleanup()
    return this
  }
}
