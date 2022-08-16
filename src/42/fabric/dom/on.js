import { normalizeListen, delegate, handler } from "./listen.js"

const OR_REGEX = /\s*\|\|\s*/

const DEFAULTS = {
  passive: false,
  capture: false,
  once: false,
  signal: undefined,
}

export const eventsMap = ({ el, listeners }) => {
  for (let { selector, events, options } of listeners) {
    options = { ...DEFAULTS, ...options }
    for (let [key, fn] of Object.entries(events)) {
      fn = selector ? delegate(selector, fn) : handler(fn)
      for (const event of key.split(OR_REGEX)) {
        console.log(event)
        el.addEventListener(event, fn, options)
      }
    }
  }
}

export default function on(...args) {
  const { list, cancels } = normalizeListen(args)
  for (const item of list) eventsMap(item)
  if (cancels) {
    return () => {
      for (const cancel of cancels) cancel()
    }
  }
}
