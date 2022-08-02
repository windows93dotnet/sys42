/* eslint-disable guard-for-in */

const OR_REGEX = /\s*\|\|\s*/

const _EVENTS = Symbol.for("_EVENTS")

export default class Emitter {
  static EVENTS = _EVENTS

  constructor(options) {
    Object.defineProperty(this, _EVENTS, {
      value: options?.events
        ? Object.assign(Object.create(null), options.events)
        : Object.create(null),
      writable: true,
    })

    options?.signal?.addEventListener("abort", () => {
      this.off("*")
    })
  }

  on(events, options, fn) {
    if (typeof options === "function") {
      fn = options
      options = undefined
    }

    for (const event of events.split(OR_REGEX)) {
      if (typeof fn === "function") {
        this[_EVENTS][event] ??= []
        this[_EVENTS][event].push(fn)
      }
    }

    options?.signal?.addEventListener("abort", () => this.off(events, fn))

    if (options?.off) return () => this.off(events, fn)

    return this
  }

  off(events, fn) {
    for (const event of events.split(OR_REGEX)) {
      if (event === "*" && !fn) {
        for (const key in this[_EVENTS]) {
          delete this[_EVENTS][key]
        }
      } else if (fn && this[_EVENTS][event]) {
        this[_EVENTS][event] = this[_EVENTS][event].filter(
          (cb) => cb !== fn && cb.fn !== fn
        )
      } else delete this[_EVENTS][event]
    }

    return this
  }

  once(event, fn) {
    if (fn === undefined) {
      return new Promise((resolve) => {
        const on = (arg) => {
          this.off(event, on)
          resolve(arg)
        }

        this.on(event, on)
      })
    }

    const on = (...args) => {
      this.off(event, on)
      return fn(...args)
    }

    on.fn = fn
    this.on(event, on)
    return this
  }

  emit(events, ...args) {
    for (const event of events.split(OR_REGEX)) {
      if (event in this[_EVENTS]) {
        this[_EVENTS][event].forEach((fn) => fn(...args))
      }

      if ("*" in this[_EVENTS]) {
        this[_EVENTS]["*"].forEach((fn) => fn(event, ...args))
      }
    }

    return this
  }

  // emit and wait all async callback to end
  send(events, ...args) {
    const undones = []
    for (const event of events.split(OR_REGEX)) {
      if (event in this[_EVENTS]) {
        this[_EVENTS][event].forEach((fn) => undones.push(fn(...args)))
      }

      if ("*" in this[_EVENTS]) {
        this[_EVENTS]["*"].forEach((fn) => undones.push(fn(event, ...args)))
      }
    }

    return Promise.all(undones)
  }
}
