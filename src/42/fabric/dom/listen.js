import signature from "./signature.js"
import cancelEvent from "./cancelEvent.js"

const OR_REGEX = /\s*\|\|\s*/

const DEFAULTS = {
  passive: false,
  capture: false,
  once: false,
  signal: undefined,
}

export const delegate = (selector, fn) => (e) => {
  const target = e.target.closest(selector)
  if (target && fn(e, target) === false) cancelEvent(e)
}

const handle = (fn, el) => (e) => {
  if (fn(e, el) === false) cancelEvent(e)
}

const getOptions = (options1, options2) => {
  if (typeof options1 === "boolean") options1 = { capture: options1 }
  if (typeof options2 === "boolean") options2 = { capture: options2 }
  return { ...DEFAULTS, ...options1, ...options2 }
}

function arrayToListener(listener) {
  const out = { options: undefined, listener: undefined }
  for (const item of listener) {
    out[typeof item === "function" ? "listener" : "options"] = item
  }

  return out
}

export const eventsMap = (el, selector, events, options) => {
  const handlers = []

  for (let [eventList, listener] of Object.entries(events)) {
    for (const event of eventList.split(OR_REGEX)) {
      let config
      if (typeof listener === "object") {
        if (Array.isArray(listener)) listener = arrayToListener(listener)
        config = listener.options
        listener = listener.listener
      }

      const handler = selector
        ? delegate(selector, listener)
        : handle(listener, el)
      options = getOptions(options, config)

      el.addEventListener(event, handler, options)
      handlers.push([event, handler, options])
    }
  }

  // TODO: test abort signal
  return () => {
    for (const [event, handler, options] of handlers) {
      el.removeEventListener(event, handler, options)
    }

    handlers.length = 0
  }
}

// TODO: rewrite signature to allow options scope
// e.g. listen({ once: true, load }, { resize })
export default function listen(...args) {
  const config = signature(Object.create(null), args, DEFAULTS)
  const { el, options, listener, selector, definitions } = config
  const map = definitions ?? { [selector]: listener }
  return eventsMap(el, selector, map, options)
}
