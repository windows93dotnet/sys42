import uid from "../fabric/uid.js"
import defer from "../fabric/type/promise/defer.js"
import Emitter from "../fabric/class/Emitter.js"

const sources = new WeakMap()

globalThis.addEventListener(
  "message",
  async ({ origin, data, source, ports }) => {
    if (origin !== "null" && origin !== location.origin) return

    if (data?.type === "IPC_PING") {
      const port = ports[0]
      if (!port) {
        console.warn("IPC_PING: missing port")
        return
      }

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
        console.warn("IPC_PING: untrusted")
        return
      }

      const meta = {
        origin,
        source,
        iframe,
        port,
        get send() {
          return function (events, ...args) {
            port.postMessage({ type: "IPC_SEND", events, args })
          }
        },
      }

      port.postMessage({ type: "IPC_PONG" })
      port.onmessage = async ({ data: { id, type, event, data } }) => {
        if (type === "emit") {
          if (sources.has(source)) sources.get(source).emit(event, data, meta)
          ipc.emit(event, data, meta)
        } else if (type === "send") {
          const undones = []

          if (sources.has(source)) {
            undones.push(sources.get(source).send(event, data, meta))
          }

          undones.push(ipc.send(event, data, meta))

          let res = (await Promise.all(undones)).flat()
          if (undones.length === 1) res = res[0]
          port.postMessage({ id, res })
        }
      }
    }
  }
)

export class Receiver extends Emitter {
  destroy() {
    this.off("*")
  }
}

export class Sender extends Emitter {
  #queue

  constructor(target, targetOrigin) {
    super()
    const { port1, port2 } = new MessageChannel()
    this.port1 = port1
    this.port2 = port2
    const message = { type: "IPC_PING" }
    target.postMessage(message, targetOrigin, [port2])

    this.#queue = new Map()

    this.ready = new Promise((resolve) => {
      port1.onmessage = ({ data }) => {
        if (data.id && this.#queue.has(data.id)) {
          this.#queue.get(data.id).resolve(data.res)
          this.#queue.delete(data.id)
          return
        }

        if (data.type === "IPC_PONG") return resolve()

        if (data.type === "IPC_SEND") {
          return super.emit(data.events, ...data.args)
        }
      }
    })
  }

  emit(event, data) {
    this.port1.postMessage({ type: "emit", event, data })
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
  from(source) {
    if (source instanceof HTMLIFrameElement) source = source.contentWindow
    const receiver = new Receiver()
    sources.set(source, receiver)
    return receiver
  }

  to(target, targetOrigin) {
    if (target instanceof HTMLIFrameElement) {
      // default "targetOrigin" use wildcard only if iframe is sandboxed
      // with "allow-same-origin" and is from same origin.
      const iframeOrigin = target.src
        ? new URL(target.src).origin
        : target.srcdoc
        ? location.origin
        : undefined

      targetOrigin ??= target.sandbox.contains("allow-same-origin")
        ? iframeOrigin
        : iframeOrigin === location.origin
        ? "*"
        : iframeOrigin

      target = target.contentWindow
    } else {
      targetOrigin ??= location.origin === "null" ? "*" : location.origin
    }

    return new Sender(target, targetOrigin)
  }
}

const ipc = new IPC()
export default ipc
