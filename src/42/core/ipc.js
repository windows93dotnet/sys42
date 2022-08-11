import inTop from "./env/realm/inTop.js"
import inIframe from "./env/realm/inIframe.js"
import inWorker from "./env/realm/inWorker.js"
import uid from "./uid.js"
import defer from "../fabric/type/promise/defer.js"
import Emitter from "../fabric/class/Emitter.js"
import Canceller from "../fabric/class/Canceller.js"

const sources = new WeakMap()

const PING = "42_IPC_PING"
const PONG = "42_IPC_PONG"
const EMIT = "42_IPC_EMIT"
const CLOSE = "42_IPC_CLOSE"
const HANDSHAKE = "42_IPC_HANDSHAKE"

async function messageHandler({ origin, data, source, ports, target }) {
  const worker = target instanceof Worker ? target : undefined

  if (!worker && origin !== "null" && origin !== location.origin) return

  if (data?.type === PING) {
    const port = ports[0]
    if (!port) throw new Error("IPC_PING: missing port")

    let iframe
    if (worker) {
      source = worker
    } else {
      for (const el of document.querySelectorAll("iframe")) {
        if (el.contentWindow === source) {
          iframe = el
          break
        }
      }
    }

    const trusted =
      worker ||
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
      worker,
      port,
      get emit() {
        return (events, ...args) => {
          port.postMessage({ type: EMIT, events, args })
        }
      },
    }

    port.postMessage({ type: PONG })

    port.onmessage = ({ data: { id, type, event, data } }) => {
      if (type === "emit") {
        if (sources.has(source)) sources.get(source).emit(event, data, meta)
        ipc.emit(event, data, meta)
      } else if (type === "send") {
        const undones = []

        if (sources.has(source)) {
          const dest = sources.get(source)
          if (event in dest[Emitter.EVENTS]) {
            undones.push(dest.send(event, data, meta))
          }
        }

        if (event in ipc[Emitter.EVENTS]) {
          undones.push(ipc.send(event, data, meta))
        }

        if (undones.length === 0) {
          const err = new Error(`No ipc listener for ${event}`)
          port.postMessage({ id, err })
          return
        }

        Promise.all(undones)
          .then((res) => {
            res = res.flat()
            port.postMessage({ id, res: res[0], all: res })
          })
          .catch((err) => {
            port.postMessage({ id, err })
          })
      }
    }
  }
}

export class Receiver extends Emitter {
  #cancel

  constructor(source, options) {
    super({ signal: options?.signal })
    options?.signal?.addEventListener("abort", () => this.destroy())
    this.#cancel = new Canceller(options?.signal)

    if (globalThis.HTMLIFrameElement && source instanceof HTMLIFrameElement) {
      source = source.contentWindow
    } else if ("onmessage" in source) {
      const options = { signal: this.#cancel.signal }
      source.addEventListener("message", messageHandler, options)
    }

    this.source = source
    sources.set(source, this)
  }

  destroy() {
    this.emit("destroy", this)
    this.off("*")
    sources.delete(this.source)
    this.#cancel?.()
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

    if (globalThis.HTMLIFrameElement && target instanceof HTMLIFrameElement) {
      // default "options.origin" use wildcard only if iframe is sandboxed
      // without "allow-same-origin" and is from same origin.
      const iframeOrigin = target.src
        ? new URL(target.src).origin
        : target.srcdoc
        ? location.origin
        : undefined

      options.origin ??= target.sandbox.contains("allow-same-origin")
        ? iframeOrigin
        : target.hasAttribute("sandbox") && iframeOrigin === location.origin
        ? "*"
        : iframeOrigin

      target = target.contentWindow
    } else {
      options.origin ??= location.origin === "null" ? "*" : location.origin
    }

    if (inWorker) {
      globalThis.postMessage({ type: PING }, [port2])
    } else {
      target.postMessage({ type: PING }, options.origin, [port2])
    }

    this.port1.onmessage = ({ data }) => {
      if (data.id && this.#queue.has(data.id)) {
        if (data.err) this.#queue.get(data.id).reject(data.err)
        else this.#queue.get(data.id).resolve(data.res)
        return void this.#queue.delete(data.id)
      }

      if (data.type === EMIT) return super.emit(data.events, ...data.args)

      if (data.type === PONG) return this.ready.resolve()
    }
  }

  emit(event, data) {
    // emit() must be async to allow emiting in "pagehide" or "beforeunload" events
    // but if ready is not resolved yet we wait for it
    const msg = { type: "emit", event, data }
    if (this.ready.isPending) this.ready.then(() => this.port1.postMessage(msg))
    else this.port1.postMessage(msg)
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
    this.emit("destroy", this)
    this.off("*")
    this.port1.close()
    this.port2.close()
  }
}

export class IPC extends Emitter {
  inTop = inTop
  inIframe = inIframe
  inWorker = inWorker
  iframes = new Map()

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
      top ??= ipc //
        .to(globalThis.opener ?? globalThis.top)
        .on("destroy", () => {
          top = undefined
        })
      return top
    },
  },
  parent: {
    get() {
      parent ??= ipc //
        .to(globalThis.opener ?? globalThis.parent)
        .on("destroy", () => {
          parent = undefined
        })
      return parent
    },
  },
})

if (inTop) {
  ipc
    .on(HANDSHAKE, (data, meta) => {
      if (meta.iframe) ipc.iframes.set(meta.iframe, meta)
    })
    .on(CLOSE, (data, meta) => {
      if (meta.iframe) ipc.iframes.delete(meta.iframe)
    })
} else if (inIframe) {
  globalThis.addEventListener("pageshow", () => ipc.to.top.emit(HANDSHAKE))
  globalThis.addEventListener("pagehide", () => ipc.to.top.emit(CLOSE))
}

const bc = new BroadcastChannel("42_WORKER_HANDSHAKE")
if (inWorker) {
  console.log(globalThis.opener)
  bc.postMessage({ type: PING })
} else {
  bc.onmessage = (...args) => {
    console.log(888, args)
  }
}

globalThis.addEventListener("message", messageHandler)

Object.freeze(ipc)
Object.freeze(ipc.to)

export default ipc
