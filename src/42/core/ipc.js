import uid from "./uid.js"
import defer from "../fabric/type/promise/defer.js"
import Emitter from "../fabric/class/Emitter.js"

const sources = new WeakMap()

globalThis.addEventListener(
  "message",
  async ({ origin, data, source, ports }) => {
    if (origin !== "null" && origin !== location.origin) return

    if (data?.type === "IPC_PING") {
      const port = ports[0]
      if (!port) throw new Error("IPC_PING: missing port")

      let iframe
      for (const el of document.querySelectorAll("iframe")) {
        if (el.contentWindow === source) {
          iframe = el
          break
        }
      }

      const trusted =
        origin === location.origin ||
        (iframe &&
          (iframe.src
            ? new URL(iframe.src).origin === location.origin
            : Boolean(iframe.srcdoc)))

      if (!trusted) {
        throw new DOMException(
          `IPC_PING: untrusted origin: ${origin}`,
          "SecurityError"
        )
      }

      const meta = {
        origin,
        source,
        iframe,
        port,
        get emit() {
          return (events, ...args) => {
            port.postMessage({ type: "IPC_EMIT", events, args })
          }
        },
      }

      port.postMessage({ type: "IPC_PONG" })

      port.onmessage = ({ data: { id, type, event, data } }) => {
        if (type === "emit") {
          if (sources.has(source)) sources.get(source).emit(event, data, meta)
          ipc.emit(event, data, meta)
        } else if (type === "send") {
          const undones = []

          if (sources.has(source)) {
            undones.push(sources.get(source).send(event, data, meta))
          }

          undones.push(ipc.send(event, data, meta))

          Promise.all(undones)
            .then((res) => {
              res = res.flat()
              if (undones.length === 1) res = res[0]
              port.postMessage({ id, res })
            })
            .catch((err) => {
              port.postMessage({ id, err })
            })
        }
      }
    }
  }
)

export class Receiver extends Emitter {
  constructor(source, options) {
    super({ signal: options?.signal })
    options?.signal?.addEventListener("abort", () => this.destroy())

    if (source instanceof HTMLIFrameElement) source = source.contentWindow
    sources.set(source, this)
  }

  destroy() {
    this.off("*")
  }
}

export class Sender extends Emitter {
  #queue

  constructor(target, options = {}) {
    super({ signal: options?.signal })
    options?.signal?.addEventListener("abort", () => this.destroy())

    const { port1, port2 } = new MessageChannel()
    this.port1 = port1
    this.port2 = port2

    this.#queue = new Map()
    this.ready = defer()

    if (target instanceof HTMLIFrameElement) {
      // default "targetOrigin" use wildcard only if iframe is sandboxed
      // with "allow-same-origin" and is from same origin.
      const iframeOrigin = target.src
        ? new URL(target.src).origin
        : target.srcdoc
        ? location.origin
        : undefined

      options.origin ??= target.sandbox.contains("allow-same-origin")
        ? iframeOrigin
        : iframeOrigin === location.origin
        ? "*"
        : iframeOrigin

      target = target.contentWindow
    } else {
      options.origin ??= location.origin === "null" ? "*" : location.origin
    }

    target.postMessage({ type: "IPC_PING" }, options.origin, [port2])

    this.port1.onmessage = ({ data }) => {
      if (data.id && this.#queue.has(data.id)) {
        if (data.err) {
          this.#queue.get(data.id).reject(data.err)
        } else {
          this.#queue.get(data.id).resolve(data.res)
        }

        this.#queue.delete(data.id)
        return
      }

      if (data.type === "IPC_EMIT") {
        return super.emit(data.events, ...data.args)
      }

      if (data.type === "IPC_PONG") return this.ready.resolve()
    }
  }

  emit(event, data) {
    if (this.ready.isPending) {
      this.ready.then(() => {
        this.port1.postMessage({ type: "emit", event, data })
      })
    } else this.port1.postMessage({ type: "emit", event, data })
    return this
  }

  async send(event, data) {
    await this.ready
    const id = uid()
    const reply = defer()
    this.#queue.set(id, reply)
    this.port1.postMessage({ id, type: "send", event, data })
    return reply
  }

  destroy() {
    this.off("*")
    this.port1.close()
    this.port2.close()
  }
}

export class IPC extends Emitter {
  from(source, options) {
    return new Receiver(source, options)
  }

  to(target, options) {
    return new Sender(target, options)
  }
}

const ipc = new IPC()

let top
let parent
Object.defineProperties(ipc.to, {
  top: {
    get() {
      top ??= ipc.to(globalThis.top)
      return top
    },
  },
  parent: {
    get() {
      parent ??= ipc.to(globalThis.parent)
      return parent
    },
  },
})

export default ipc
