import ipc from "../ipc.js"
import noop from "../../fabric/type/function/noop.js"
import ensureElement from "../../fabric/dom/ensureElement.js"
import Canceller from "../../fabric/class/Canceller.js"
import { normalizeListen, eventsMap } from "../../fabric/dom/listen.js"

const { inTop, inIframe } = ipc

const CALL = "42_XLISTEN_CALL"
const DOM_EVENT = "42_XLISTEN_DOM_EVENT"
const DESTROY = "42_XLISTEN_DESTROY"
const HANDSHAKE = "42_IPC_HANDSHAKE"

function serializeArgs(args) {
  const out = []

  for (const { selector, listeners } of args) {
    out.push({
      selector,
      listeners: listeners.map(({ events }) => Object.keys(events)),
    })
  }

  return out
}

function serializeTarget(target) {
  return {
    inIframe: true,
    isActive: target === document.activeElement,
    id: target.id,
    rect: target.getBoundingClientRect(),
  }
}

function serializeEvent(e) {
  const out = {}

  // eslint-disable-next-line guard-for-in
  for (const key in e) {
    const val = e[key]

    if (key === "target") {
      out[key] = serializeTarget(val)
      continue
    }

    const type = typeof e[key]

    if (type !== "function" && type !== "object") out[key] = val
  }

  return out
}

let xlisten

if (inTop) {
  const registry1 = []
  const registry2 = []

  xlisten = function xlisten(...args) {
    const { list, cancels } = normalizeListen(args)

    for (const item of list) {
      if (!item.selector && item.el !== globalThis) {
        throw new Error("xlisten only support selectors")
      }

      eventsMap(item)
    }

    const id = registry2.length

    const serialized = serializeArgs(list)
    for (const { emit, iframe } of ipc.iframes.values()) {
      iframe.classList.add("xlisten")
      emit(CALL, [id, serialized])
    }

    registry1.push(list)
    registry2.push(serialized)

    return () => {
      registry1.splice(id, 1)
      registry2.splice(id, 1)

      for (const { emit, iframe } of ipc.iframes.values()) {
        iframe.classList.remove("xlisten")
        emit(DESTROY, id)
      }

      for (const cancel of cancels) cancel()
    }
  }

  ipc.on(HANDSHAKE, (data, meta) => {
    if (meta.iframe) {
      meta.iframe.classList.add("xlisten")
      for (let i = 0, l = registry2.length; i < l; i++) {
        meta.emit(CALL, [i, registry2[i]])
      }
    }
  })

  ipc.on(DOM_EVENT, ({ id, i, j, key, e, target }) => {
    const fn = registry1[id]?.[i].listeners[j].events[key]
    fn?.(e, target)
  })
}

if (inIframe) {
  xlisten = noop

  const cancels = new Map()

  ipc
    .on(DESTROY, (id) => {
      cancels.get(id)?.()
      cancels.delete(id)
    })
    .on(CALL, ([id, args]) => {
      const cancel = new Canceller()
      cancels.set(id, cancel)

      for (let i = 0, l = args.length; i < l; i++) {
        const { selector, listeners } = args[i]
        const item = {
          el: selector ? ensureElement(selector) : globalThis,
          listeners: listeners.map((events, j) => ({
            options: { signal: cancel.signal },
            events: Object.fromEntries(
              events.map((key) => [
                key,
                (e, target) => {
                  const data = { id, i, j, key }
                  data.e = serializeEvent(e)
                  data.target = serializeTarget(target)
                  ipc.emit(DOM_EVENT, data)
                },
              ])
            ),
          })),
        }

        eventsMap(item)
      }
    })
}

export default xlisten
