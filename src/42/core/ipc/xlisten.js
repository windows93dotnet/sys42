import ipc from "../ipc.js"
import noop from "../../fabric/type/function/noop.js"
import ensureElement from "../../fabric/dom/ensureElement.js"
import { normalizeListen, eventsMap } from "../../fabric/dom/listen.js"

const { inTop, inIframe } = ipc

const CALL = "42_XLISTEN_CALL"
const DOM_EVENT = "42_XLISTEN_DOM_EVENT"
// const DESTROY = "42_XLISTEN_DESTROY"
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

function serializeEvent(e) {
  const out = { ...e }

  // eslint-disable-next-line guard-for-in
  for (const key in e) {
    const val = e[key]

    if (key === "target") {
      out[key] = { rect: val.getBoundingClientRect() }
      continue
    }

    const type = typeof e[key]

    if (type !== "function" && type !== "object") out[key] = val
  }

  return out
}

let xlisten

if (inTop) {
  const registry2 = []
  const registry1 = []

  xlisten = function xlisten(...args) {
    const { list, cancels } = normalizeListen(args)

    for (const item of list) {
      if (!item.selector && item.el !== globalThis) {
        throw new Error("xlisten only support selectors")
      }

      eventsMap(item)
    }

    const serialized = serializeArgs(list)
    for (const { emit } of ipc.iframes) {
      emit(CALL, [registry2.length, serialized])
    }

    registry1.push(list)
    registry2.push(serialized)

    if (cancels) {
      return () => {
        for (const cancel of cancels) cancel()
      }
    }
  }

  ipc.on(HANDSHAKE, (data, meta) => {
    if (meta.iframe) {
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

  ipc.top.on(CALL, ([id, args]) => {
    for (let i = 0, l = args.length; i < l; i++) {
      const { selector, listeners } = args[i]
      const item = {
        el: selector ? ensureElement(selector) : globalThis,
        listeners: listeners.map((events, j) => ({
          events: Object.fromEntries(
            events.map((key) => [
              key,
              (e, target) => {
                ipc.emit(DOM_EVENT, {
                  id,
                  i,
                  j,
                  key,
                  e: serializeEvent(e),
                  target: { rect: target.getBoundingClientRect() },
                })
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
