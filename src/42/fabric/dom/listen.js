import stopEvent from "./stopEvent.js"
import bisect from "../type/object/bisect.js"
import ensureElement from "./ensureElement.js"
import Canceller from "../class/Canceller.js"

const OR_REGEX = /\s*\|\|\s*/

const DEFAULTS = {
  passive: false,
  capture: false,
  once: false,
  signal: undefined,
}

const DEFAULTS_KEYS = Object.keys(DEFAULTS)
const ITEM_KEYS = ["selector", "returnForget"]

export const delegate = (selector, fn) => (e) => {
  const target = e.target.closest(selector)
  if (target && fn(e, target) === false) stopEvent(e)
}

const handler = (fn, el) => (e) => {
  if (fn(e, el) === false) stopEvent(e)
}

export const eventsMap = ({ el, listeners }) => {
  for (const { selector, events, options } of listeners) {
    for (const [key, fn] of Object.entries(events)) {
      for (const event of key.split(OR_REGEX)) {
        el.addEventListener(
          event,
          selector ? delegate(selector, fn) : handler(fn, el),
          { ...DEFAULTS, ...options }
        )
      }
    }
  }
}

export function normalizeListen(args, config) {
  const optionsKeys = config?.optionsKeys ?? DEFAULTS_KEYS
  const itemKeys = config?.itemKeys ?? ITEM_KEYS
  const getEvents = config?.getEvents ?? ((x) => x)
  let returnForget = config?.returnForget ?? true

  const list = []
  let globalOptions

  let current = { el: undefined, listeners: [] }

  for (let arg of args.flat()) {
    if (typeof arg === "string") arg = ensureElement(arg)
    if ("addEventListener" in arg) {
      if (list.length > 0) {
        current.el ??= globalThis
        list.push(current)
      }

      current = { el: arg, listeners: [] }
    } else {
      const [events, item, options] = bisect(arg, itemKeys, optionsKeys)

      if (Object.keys(events).length === 0 && Object.keys(options).length > 0) {
        if ("returnForget" in item) returnForget = item.returnForget
        globalOptions = options
        continue
      }

      item.events = getEvents(events)
      item.options = options
      current.listeners.push(item)
    }
  }

  current.el ??= globalThis
  list.push(current)

  const cancels = returnForget ? [] : undefined

  for (const { listeners: map } of list) {
    for (const item of map) {
      item.options = { ...globalOptions, ...item.options }

      if (returnForget) {
        const { cancel, signal } = new Canceller(item.options.signal)
        item.options.signal = signal
        cancels.push(cancel)
      }
    }
  }

  return { list, cancels }
}

export default function listen(...args) {
  const { list, cancels } = normalizeListen(args)
  for (const item of list) eventsMap(item)
  if (cancels) {
    return () => {
      for (const cancel of cancels) cancel()
    }
  }
}
