/* eslint-disable complexity */
import realm from "./env/realm.js"
import inVhost from "./env/realm/inVhost.js"
import uid from "./uid.js"
import defer from "../fabric/type/promise/defer.js"
import Emitter from "../fabric/classes/Emitter.js"
import Canceller from "../fabric/classes/Canceller.js"
import serializeError from "../fabric/type/error/serializeError.js"
import deserializeError from "../fabric/type/error/deserializeError.js"
import SecurityError from "../fabric/errors/SecurityError.js"
import TimeoutError from "../fabric/errors/TimeoutError.js"

const defaultTargetOrigin = inVhost
  ? new URLSearchParams(location.search).get("targetOrigin")
  : undefined

const sources = new WeakMap()
const origins = new Map()

const PING = "42_IPC_PING"
const PONG = "42_IPC_PONG"
const EMIT = "42_IPC_EMIT"
const SEND = "42_IPC_SEND"
const CLOSE = "42_IPC_CLOSE"
const HANDSHAKE = "42_IPC_HANDSHAKE"

const pickFirst = (res) => res[0]

function findIframe(source) {
  for (const el of document.querySelectorAll("iframe")) {
    if (el.contentWindow === source) return el
  }
}

async function messageHandler(e) {
  if (!e.isTrusted) return

  let { origin, data, source, ports, target } = e
  const isWindow = source && source.self === source

  if (
    isWindow &&
    origin !== "null" &&
    location.origin !== "null" &&
    origin !== location.origin &&
    !origins.has(origin)
  ) {
    return
  }

  if (data?.type === PING) {
    const port = ports[0]
    if (!port) throw new Error("IPC_PING: missing port")

    const [type, worker, iframe] = isWindow
      ? source.opener
        ? ["ChildWindow", undefined]
        : ["Iframe", undefined, findIframe(source)]
      : globalThis.ServiceWorker !== undefined &&
          source instanceof ServiceWorker
        ? ["ServiceWorker", source]
        : globalThis.Worker !== undefined && target instanceof Worker
          ? ["DedicatedWorker", target]
          : target instanceof MessagePort && sources.has(target)
            ? ["SharedWorker", target]
            : []

    const trusted = Boolean(
      worker ||
        origin === location.origin ||
        window.parent === source ||
        origins.has(origin) ||
        (iframe &&
          (iframe.src
            ? new URL(iframe.src).origin === location.origin
            : iframe.srcdoc)),
    )

    if (!trusted) {
      throw new SecurityError(`IPC_PING: untrusted origin: ${origin}`)
    }

    if (worker) source = worker

    let pendingReplies

    const meta = {
      type,
      origin,
      source,
      iframe,
      worker,
      port,
      transfer: [],
      get emit() {
        return (events, ...args) => {
          port.postMessage({ type: EMIT, events, args })
        }
      },
      get send() {
        pendingReplies ??= {}
        return async (events, ...args) => {
          const id = uid()
          port.postMessage({ type: SEND, id, events, args })
          pendingReplies[id] = defer()
          return pendingReplies[id]
        }
      },
    }

    port.postMessage({ type: PONG })

    port.onmessage = ({ data: { id, type, event, data } }) => {
      if (type === "emit") {
        if (sources.has(source)) sources.get(source).emit(event, data, meta)
        if (origins.has(origin)) origins.get(origin).emit(event, data, meta)
        ipc.self.emit(event, data, meta)
      } else if (type === "send") {
        const undones = []

        if (sources.has(source)) {
          const dest = sources.get(source)
          if (event in dest[Emitter.EVENTS]) {
            undones.push(dest.send(event, data, meta).then(pickFirst))
          }
        }

        if (origins.has(origin)) {
          const dest = origins.get(origin)
          if (event in dest[Emitter.EVENTS]) {
            undones.push(dest.send(event, data, meta).then(pickFirst))
          }
        }

        if (event in ipc[Emitter.EVENTS]) {
          undones.push(ipc.self.send(event, data, meta).then(pickFirst))
        }

        if (undones.length === 0) {
          const err = new Error(`No ipc listener for ${event}`)
          port.postMessage({ id, err })
          return
        }

        Promise.all(undones)
          .then((res) => {
            let options

            if (meta.transfer.length > 0) {
              options = { transfer: [...meta.transfer] }
              meta.transfer.length = 0
            }

            port.postMessage({ id, res: res[0] }, options)
          })
          .catch((err) => {
            port.postMessage({ id, err: serializeError(err) })
          })
      } else if (type === "reply") {
        pendingReplies[id]?.resolve(data)
        delete pendingReplies[id]
      }
    }
  }
}

function ping(target, port, targetOrigin) {
  targetOrigin ??= defaultTargetOrigin ?? "*" // TODO: find a way to avoid "*"
  target.postMessage({ type: PING }, targetOrigin, [port])
}

function autoTarget(port, options) {
  if (realm.inIframe) {
    ping(inVhost ? window.top : window.parent, port, options.targetOrigin)
  } else if (realm.inChildWindow) {
    ping(window.opener, port, options.targetOrigin)
  } else if (realm.inDedicatedWorker) {
    self.postMessage({ type: PING }, [port])
  }
}

function normalizeTarget(target, port, options) {
  if (globalThis.HTMLIFrameElement && target instanceof HTMLIFrameElement) {
    // default "options.targetOrigin" use wildcard only if iframe is sandboxed
    // without "allow-same-origin" and is from same origin.
    const iframeOrigin = target.src
      ? new URL(target.src).origin
      : target.srcdoc
        ? location.origin
        : undefined

    options.targetOrigin ??= target.sandbox.contains("allow-same-origin")
      ? iframeOrigin
      : target.hasAttribute("sandbox") && iframeOrigin === location.origin
        ? "*"
        : iframeOrigin

    ping(target.contentWindow, port, options.targetOrigin)
  } else if (target.self === target) {
    ping(target, port, options.targetOrigin)
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

    const timeout = options?.timeout ?? 1000
    this.ready = defer({
      timeout: realm.inTop ? undefined : timeout,
      timeoutError: realm.inTop
        ? undefined
        : new TimeoutError(`ipc connection timed out: ${timeout}ms`),
    })

    this.ignoreUnresponsive = options?.ignoreUnresponsive ?? false

    if (target === undefined) autoTarget(port2, options)
    else normalizeTarget(target, port2, options)

    this.port.onmessage = ({ data }) => {
      if (data.id && this.#queue.has(data.id)) {
        if (data.err) {
          this.#queue.get(data.id).reject(deserializeError(data.err))
        } else this.#queue.get(data.id).resolve(data.res)
        return void this.#queue.delete(data.id)
      }

      if (data.type === EMIT) return void super.emit(data.events, ...data.args)

      if (data.type === SEND) {
        return void super.send(data.events, ...data.args).then((res) => {
          this.port.postMessage({ id: data.id, type: "reply", data: res[0] })
        })
      }

      if (data.type === PONG) return void this.ready.resolve()
    }
  }

  emit(event, data, options) {
    const msg = { type: "emit", event, data }
    // emit() must be async to allow emiting in "pagehide" or "beforeunload" events
    // but if ready is not resolved yet we wait for it
    if (this.ready.isPending) {
      if (this.ignoreUnresponsive) return this
      this.ready
        .then(() => this.port.postMessage(msg, options))
        .catch((err) => {
          if (event === HANDSHAKE) return
          throw new TimeoutError(err.message)
        })
    } else this.port.postMessage(msg, options)
    return this
  }

  async send(event, data, options) {
    if (this.ignoreUnresponsive && this.ready.isPending) return

    try {
      await this.ready
    } catch (err) {
      throw new TimeoutError(err.message)
    }

    const id = uid()
    const reply = defer({ timeout: options?.timeout })
    this.#queue.set(id, reply)
    this.port.postMessage({ type: "send", id, event, data }, options)
    return reply
  }

  async sendOnce(event, data, options) {
    const res = await this.send(event, data, options)
    this.destroy()
    return res
  }

  destroy() {
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

    const timeout = options?.timeout ?? 1000
    this.ready = defer({
      timeout,
      timeoutError: new TimeoutError(`ipc connection timed out: ${timeout}ms`),
    })

    self.addEventListener("connect", (e) => {
      this.clients.push(new Sender(e.ports[0]))
      this.ready.resolve()
    })
  }

  emit(...args) {
    if (this.ready.isPending) {
      this.ready
        .then(() => {
          for (const client of this.clients) client.emit(...args)
        })
        .catch((err) => {
          throw new TimeoutError(err.message)
        })
    } else {
      for (const client of this.clients) client.emit(...args)
    }

    return this
  }

  async send(...args) {
    try {
      await this.ready
    } catch (err) {
      throw new TimeoutError(err.message)
    }

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
        this.map.delete(client)
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

  #addSource(source) {
    this.source = source
    sources.set(source, this)
  }

  constructor(source, options) {
    super({ signal: options?.signal })
    options?.signal?.addEventListener("abort", () => this.destroy())
    this.#cancel = new Canceller(options?.signal)

    if (typeof source === "string") {
      this.origin = source
      origins.set(source, this)
    } else if ("port" in source) {
      source.port.addEventListener("message", messageHandler, options)
      source.port.start?.()
      this.#addSource(source.port)
    } else if (
      globalThis.HTMLIFrameElement &&
      source instanceof HTMLIFrameElement
    ) {
      if (source.contentWindow) {
        this.#addSource(source.contentWindow)
      } else {
        source.addEventListener("load", () => {
          this.#addSource(source.contentWindow)
        })
      }
    } else if ("onmessage" in source) {
      const options = { signal: this.#cancel.signal }
      source.addEventListener("message", messageHandler, options)
      source.start?.()
      if (source.contentWindow) this.#addSource(source.contentWindow)
    }
  }

  destroy(options) {
    this.off("*")
    if (this.source) sources.delete(this.source)
    if (this.origin) origins.delete(this.origin)
    if (options?.close) this.source?.close?.()
    this.#cancel?.()
  }
}

export const ipc = realm.inSharedWorker
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

if (realm.inWindow || realm.inServiceWorker) {
  globalThis.addEventListener("message", messageHandler)
}

if (realm.inWindow && !realm.inOpaqueOrigin) {
  navigator.serviceWorker?.addEventListener("message", messageHandler)
}

Object.assign(ipc, realm)
Object.freeze(ipc)

export default ipc
