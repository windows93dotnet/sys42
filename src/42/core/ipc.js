import * as realm from "./env/realm.js"
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

function findIframe(source) {
  for (const el of document.querySelectorAll("iframe")) {
    if (el.contentWindow === source) return el
  }
}

async function messageHandler(e) {
  if (!e.isTrusted) return

  let { origin, data, source, ports, target } = e
  const isWindow = source && source.self === source

  if (isWindow && origin !== "null" && origin !== location.origin) return

  if (data?.type === PING) {
    const port = ports[0]
    if (!port) throw new Error("IPC_PING: missing port")

    const [type, worker, iframe] = isWindow
      ? source.opener
        ? ["ChildWindow", undefined]
        : ["Iframe", undefined, findIframe(source)]
      : source instanceof ServiceWorker
      ? ["ServiceWorker", source]
      : target instanceof Worker
      ? ["DedicatedWorker", target]
      : target instanceof MessagePort && sources.has(target)
      ? ["SharedWorker", target]
      : []

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

    if (worker) source = worker

    const meta = {
      type,
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
        ipc.self.emit(event, data, meta)
      } else if (type === "send") {
        const undones = []

        if (sources.has(source)) {
          const dest = sources.get(source)
          if (event in dest[Emitter.EVENTS]) {
            undones.push(dest.send(event, data, meta))
          }
        }

        if (event in ipc[Emitter.EVENTS]) {
          undones.push(ipc.self.send(event, data, meta))
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

function ping(target, port, origin) {
  origin ??= location.origin === "null" ? "*" : location.origin
  target.postMessage({ type: PING }, origin, [port])
}

function autoTarget(port, options) {
  if (realm.inIframe) {
    ping(window.parent, port, options.origin)
  } else if (realm.inChildWindow) {
    ping(window.opener, port, options.origin)
  } else if (realm.inDedicatedWorker) {
    self.postMessage({ type: PING }, [port])
  }
}

function normalizeTarget(target, port, options) {
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

    ping(target.contentWindow, port, options.origin)
  } else if (target.self === target) {
    ping(target, port, options.origin)
  } else {
    target.postMessage({ type: PING }, [port])
  }
}

export class Sender extends Emitter {
  #queue

  constructor(target, options = {}) {
    super({ signal: options?.signal })
    options?.signal?.addEventListener("abort", () => this.destroy())
    this.self = {
      emit: (...args) => super.emit(...args),
      send: async (...args) => super.send(...args),
    }

    const { port1, port2 } = new MessageChannel()
    this.port = port1
    this.remote = port2
    this.#queue = new Map()
    this.ready = defer()

    if (target === undefined) autoTarget(port2, options)
    else normalizeTarget(target, port2, options)

    this.port.onmessage = ({ data }) => {
      if (data.id && this.#queue.has(data.id)) {
        if (data.err) this.#queue.get(data.id).reject(data.err)
        else this.#queue.get(data.id).resolve(data.res)
        return void this.#queue.delete(data.id)
      }

      if (data.type === EMIT) return void super.emit(data.events, ...data.args)
      if (data.type === PONG) return void this.ready.resolve()
    }
  }

  emit(event, data, transfer) {
    // emit() must be async to allow emiting in "pagehide" or "beforeunload" events
    // but if ready is not resolved yet we wait for it
    const msg = { type: "emit", event, data }
    if (this.ready.isPending) {
      this.ready.then(() => this.port.postMessage(msg, transfer))
    } else this.port.postMessage(msg, transfer)
    return this
  }

  async send(event, data, transfer) {
    await this.ready
    const id = uid()
    const reply = defer()
    this.#queue.set(id, reply)
    this.port.postMessage({ id, type: "send", event, data }, transfer)
    return reply
  }

  destroy() {
    this.emit("destroy", this)
    this.off("*")
    this.port.close()
    this.remote.close()
  }
}

export class SharedWorkerSender extends Emitter {
  constructor(options) {
    super({ signal: options?.signal })
    options?.signal?.addEventListener("abort", () => this.destroy())
    this.self = {
      emit: (...args) => super.emit(...args),
      send: async (...args) => super.send(...args),
    }

    this.clients = []
    this.ready = defer()
    self.addEventListener("connect", (e) => {
      this.clients.push(new Sender(e.ports[0]))
      this.ready.resolve()
    })
  }

  emit(...args) {
    if (this.ready.isPending) {
      this.ready.then(() => {
        for (const client of this.clients) client.emit(...args)
      })
    } else {
      for (const client of this.clients) client.emit(...args)
    }

    return this
  }

  async send(...args) {
    await this.ready
    const undones = []
    for (const client of this.clients) undones.push(client.send(...args))
    return Promise.all(undones)
  }
}

export class ServiceWorkerSender extends Emitter {
  constructor(options) {
    super({ signal: options?.signal })
    options?.signal?.addEventListener("abort", () => this.destroy())
    this.self = {
      emit: (...args) => super.emit(...args),
      send: async (...args) => super.send(...args),
    }

    this.map = new Map()
  }

  async #ping() {
    const clients = await self.clients.matchAll({ includeUncontrolled: true })

    // remove old clients
    for (const [client, sender] of this.map.entries()) {
      if (!clients.includes(client)) {
        sender.destroy()
        this.map.remove(client)
      }
    }

    // map new clients
    for (const client of clients) {
      if (!this.map.has(client)) this.map.set(client, new Sender(client))
    }
  }

  emit(...args) {
    this.#ping().then(() => {
      for (const client of this.map.values()) client.emit(...args)
    })

    return this
  }

  async send(...args) {
    await this.#ping()
    const undones = []
    for (const client of this.map.values()) undones.push(client.send(...args))
    return Promise.all(undones)
  }
}

export class Receiver extends Emitter {
  #cancel

  constructor(source, options) {
    super({ signal: options?.signal })
    options?.signal?.addEventListener("abort", () => this.destroy())
    this.#cancel = new Canceller(options?.signal)

    if ("port" in source) source = source.port

    if (globalThis.HTMLIFrameElement && source instanceof HTMLIFrameElement) {
      source = source.contentWindow
    } else if ("onmessage" in source) {
      const options = { signal: this.#cancel.signal }
      source.addEventListener("message", messageHandler, options)
      source.start?.()
    }

    this.source = source
    sources.set(source, this)
  }

  destroy(options) {
    this.emit("destroy", this)
    this.off("*")
    sources.delete(this.source)
    if (options?.close) this.source?.close?.()
    this.#cancel?.()
  }
}

const ipc = realm.inSharedWorker
  ? new SharedWorkerSender()
  : realm.inServiceWorker
  ? new ServiceWorkerSender()
  : new Sender()

ipc.iframes = new Map()

ipc.from = (source, options) => new Receiver(source, options)
ipc.to = (target, options) => new Sender(target, options)

if (realm.inTop) {
  ipc
    .on(HANDSHAKE, (data, meta) => {
      if (meta.iframe) ipc.iframes.set(meta.iframe, meta)
    })
    .on(CLOSE, (data, meta) => {
      if (meta.iframe) ipc.iframes.delete(meta.iframe)
    })
} else if (realm.inIframe) {
  globalThis.addEventListener("pageshow", () => ipc.emit(HANDSHAKE))
  globalThis.addEventListener("pagehide", () => ipc.emit(CLOSE))
}

if (!realm.inSharedWorker) {
  globalThis.addEventListener("message", messageHandler)
}

Object.assign(ipc, realm)
Object.freeze(ipc)

export default ipc
