const { hasOwnProperty } = Object

export default class Emitter {
  static EVENTS = Symbol.for("Emitter.EVENTS")

  constructor(events = Object.create(null)) {
    Object.defineProperty(this, Emitter.EVENTS, {
      value: events,
      writable: true,
    })
  }

  on(events, options, fn) {
    if (typeof options === "function") {
      fn = options
      options = undefined
    }

    for (const event of events.split(" ")) {
      if (typeof fn === "function") {
        this[Emitter.EVENTS][event] ??= []
        this[Emitter.EVENTS][event].push(fn)
      }
    }

    if (options?.signal) {
      options.signal.addEventListener("abort", () => this.off(events, fn), {
        once: true,
      })
    }

    if (options?.off) return () => this.off(events, fn)

    return this
  }

  off(events, fn) {
    for (const event of events.split(" ")) {
      if (event === "*" && !fn) {
        for (const key in this[Emitter.EVENTS]) {
          if (hasOwnProperty.call(this[Emitter.EVENTS], key)) {
            delete this[Emitter.EVENTS][key]
          }
        }
      } else if (fn && this[Emitter.EVENTS][event]) {
        this[Emitter.EVENTS][event] = this[Emitter.EVENTS][event].filter(
          (cb) => cb !== fn && cb.fn !== fn
        )
      } else delete this[Emitter.EVENTS][event]
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
    for (const event of events.split(" ")) {
      if (event in this[Emitter.EVENTS]) {
        this[Emitter.EVENTS][event].forEach((fn) => fn(...args))
      }

      if ("*" in this[Emitter.EVENTS]) {
        this[Emitter.EVENTS]["*"].forEach((fn) => fn(event, ...args))
      }
    }

    return this
  }

  // emit and wait all async callback to end
  send(events, ...args) {
    const undones = []
    for (const event of events.split(" ")) {
      if (event in this[Emitter.EVENTS]) {
        this[Emitter.EVENTS][event].forEach((fn) => undones.push(fn(...args)))
      }

      if ("*" in this[Emitter.EVENTS]) {
        this[Emitter.EVENTS]["*"].forEach((fn) =>
          undones.push(fn(event, ...args))
        )
      }
    }

    return Promise.all(undones)
  }
}
