import Emitter from "../classes/Emitter.js"

export default function emittable(item, options) {
  if (!item) return new Emitter(options)

  const events = options?.events
    ? Object.assign(Object.create(null), options.events)
    : Object.create(null)

  Object.defineProperty(item, Emitter.EVENTS, {
    value: events,
    configurable: true,
  })
  for (const key of Object.getOwnPropertyNames(Emitter.prototype)) {
    if (key !== "constructor" && key in item === false) {
      Object.defineProperty(item, key, {
        value: Emitter.prototype[key],
        configurable: true,
      })
    }
  }

  options?.signal?.addEventListener("abort", () => {
    item.off("*")
    delete item[Emitter.EVENTS]
    for (const key of Object.getOwnPropertyNames(Emitter.prototype)) {
      if (key !== "constructor" && item[key] === Emitter.prototype[key]) {
        delete item[key]
      }
    }
  })

  return item
}

emittable.EVENTS = Emitter.EVENTS
