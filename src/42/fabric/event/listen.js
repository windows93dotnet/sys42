import stopEvent from "./stopEvent.js"
import distribute from "../type/object/distribute.js"
import ensureElement from "../dom/ensureElement.js"
import Canceller from "../classes/Canceller.js"

export const SPLIT_REGEX = /\s*\|\|\s*/

const EVENT_DEFAULTS = {
  capture: false,
  once: false,
  passive: undefined,
  signal: undefined,
}

const ITEM_DEFAULTS = {
  selector: undefined,
  returnForget: true,
  repeatable: false,
  disrupt: false,
  stop: false,
  prevent: false,
  preventDefault: false,
  stopPropagation: false,
  stopImmediatePropagation: false,
}

const DEFAULTS_KEYS = Object.keys(EVENT_DEFAULTS)
const ITEM_KEYS = Object.keys(ITEM_DEFAULTS)

function cleanup(item, e) {
  if (item.preventDefault) e.preventDefault()
  if (item.stopPropagation) e.stopPropagation()
  if (item.stopImmediatePropagation) e.stopImmediatePropagation()
}

export const makeHandler = ({ selector, ...item }, fn) => {
  if (item.prevent || item.disrupt) {
    item.preventDefault = true
  }

  if (item.stop || item.disrupt) {
    item.stopPropagation = true
    item.stopImmediatePropagation = true
  }

  return selector
    ? (e) => {
        const target = e.target.closest?.(selector)
        if (target) {
          if (fn(e, target) === false) stopEvent(e)
          else cleanup(item, e)
        }
      }
    : (e) => {
        if (fn(e, e.target) === false) stopEvent(e)
        else cleanup(item, e)
      }
}

export const eventsMap = (list) => {
  for (const { el, listeners } of list) {
    for (const { events, options, ...item } of listeners) {
      for (let [key, fn] of Object.entries(events)) {
        fn = makeHandler(item, fn)
        for (const event of key.split(SPLIT_REGEX)) {
          el.addEventListener(event, fn, options)
        }
      }
    }
  }
}

const validEventTypes = new Set(["string", "function", "object"])

function ensureEvents(events) {
  for (const key in events) {
    if (Object.hasOwn(events, key)) {
      const value = events[key]

      if (value === false) {
        events[key] = () => false
        continue
      }

      const type = typeof value
      if (!(value && validEventTypes.has(type))) {
        throw Object.assign(new TypeError(`"${key}" is not a valid event`), {
          value,
        })
      }
    }
  }

  return events
}

export function normalizeListen(args, config) {
  const itemKeys = config?.itemKeys ?? ITEM_KEYS
  const optionsKeys = config?.optionsKeys ?? DEFAULTS_KEYS
  const getEvents = config?.getEvents ?? ((x) => x)
  let returnForget = config?.returnForget ?? true

  const list = []
  let globalOptions

  let current = { el: undefined, selector: undefined, listeners: [] }

  for (let arg of args.flat()) {
    let selector
    if (typeof arg === "string") {
      selector = arg
      arg = ensureElement(arg)
    }

    if ("addEventListener" in arg) {
      if (current.listeners.length > 0) {
        current.el ??= globalThis
        list.push(current)
      }

      current = { el: arg, selector, listeners: [] }
    } else {
      const [events, item, options] = distribute(arg, itemKeys, optionsKeys)

      if (Object.keys(events).length === 0 && Object.keys(options).length > 0) {
        if ("returnForget" in item) returnForget = item.returnForget
        globalOptions = globalOptions
          ? Object.assign(globalOptions, options)
          : options
        continue
      }

      item.events = getEvents(ensureEvents(events))
      item.options = options
      current.listeners.push(item)
    }
  }

  current.el ??= globalThis
  list.push(current)

  const cancels = returnForget ? [] : undefined

  for (const { listeners } of list) {
    for (const item of listeners) {
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

export function listen(...args) {
  const { list, cancels } = normalizeListen(args)
  eventsMap(list)
  if (cancels) {
    const forget = () => {
      for (const cancel of cancels) cancel()
    }

    forget.destroy = forget
    return forget
  }
}

export default listen
