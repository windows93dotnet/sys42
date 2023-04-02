import configure from "../configure.js"
import Emitter from "../../fabric/classes/Emitter.js"
import Canceller from "../../fabric/classes/Canceller.js"
import inWindow from "../env/realm/inWindow.js"

const DEFAULTS = {
  withCredentials: false,
  maxAttempt: 15,
}

const IGNORE_EVENTS = new Set(["error", "open", "connect", "disconnect"])

export class ServerSentEvents extends Emitter {
  #sse
  #timerID
  #attempt = 0
  #beforeunload

  constructor(url, options) {
    super()
    this.url = url
    this.enabled = true
    this.config = configure(DEFAULTS, options)
    this.cancel = new Canceller(options?.signal)
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

    this.#sse.addEventListener(
      "open",
      () => {
        this.emit("connect")
        this.#attempt = 0
      },
      this.cancel
    )

    this.#sse.addEventListener(
      "error",
      () => {
        this.emit("disconnect")
        this.#sse.close()
        this.#reconnect()
      },
      this.cancel
    )

    if (inWindow) {
      const options = {
        capture: true,
        signal: this.cancel.signal,
      }

      if (this.#beforeunload) {
        window.removeEventListener("beforeunload", this.#beforeunload, options)
      }

      this.#beforeunload = () => this.destroy()
      window.addEventListener("beforeunload", this.#beforeunload, options)
    }

    return this
  }

  #addListener(event) {
    if (!IGNORE_EVENTS.has(event)) {
      this.#sse.addEventListener(
        event,
        (...args) => {
          if (this.enabled) this.emit(event, ...args)
        },
        this.cancel
      )
    }
  }

  on(event, fn, returnOff) {
    if (!this.#sse) this.connect()
    this.#addListener(event)
    return super.on(event, fn, returnOff)
  }

  once(event, fn) {
    if (!this.#sse) this.connect()
    this.#addListener(event)
    return super.once(event, fn)
  }

  destroy() {
    this.#sse.close()
    this.cancel()
    this.emit("destroy", this)
    this.off("*")
    return this
  }
}

export default function serverSentEvents(...args) {
  return new ServerSentEvents(...args)
}
