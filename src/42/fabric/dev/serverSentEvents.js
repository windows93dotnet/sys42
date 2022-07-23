import configure from "../../core/configure.js"
// import toggleable from "../../fabric/trait/toggleable.js"
import Emitter from "../../fabric/class/Emitter.js"

const DEFAULTS = {
  withCredentials: false,
  maxAttempt: 15,
}

const IGNORE_EVENTS = new Set(["error", "open", "connect", "disconnect"])

export class ServerSentEvents extends Emitter {
  #sse
  #timerID
  #attempt = 0
  #events = {}

  constructor(url, options) {
    super()
    // toggleable(this)
    this.url = url
    this.enabled = true
    this.config = configure(DEFAULTS, options)
  }

  #reconnect() {
    if (++this.#attempt < this.config.maxAttempt) {
      clearTimeout(this.#timerID)
      this.#timerID = setTimeout(
        () => this.connect(),
        500 + this.#attempt * this.#attempt * 100
      )
    } else {
      this.emit("error", `maxAttempt reached (${this.config.maxAttempt})`)
    }
  }

  connect() {
    this.#sse?.close()
    this.#sse = new EventSource(this.url, this.config)

    this.#events.open = () => {
      this.emit("connect")
      this.#attempt = 0
    }

    this.#sse.addEventListener("open", this.#events.open)

    this.#events.error = () => {
      this.emit("disconnect")
      this.#sse.close()
      this.#reconnect()
    }

    this.#sse.addEventListener("error", this.#events.error)

    return this
  }

  #addListener(event) {
    if (!IGNORE_EVENTS.has(event) && event in this.#events === false) {
      this.#events[event] = (...args) => {
        if (this.enabled) this.emit(event, ...args)
      }

      this.#sse.addEventListener(event, this.#events[event])
    }
  }

  on(event, fn, returnOff) {
    this.#addListener(event)
    return super.on(event, fn, returnOff)
  }

  once(event, fn) {
    this.#addListener(event)
    return super.once(event, fn)
  }

  destroy() {
    Object.entries(this.#events).forEach(([event, fn]) =>
      this.#sse.removeEventListener(event, fn)
    )
    this.#sse.close()
    this.emit("destroy", this)
    this.off("*")
    return this
  }
}

export default function serverSentEvents(...args) {
  return new ServerSentEvents(...args)
}
