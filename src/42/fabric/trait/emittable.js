import Emitter from "../class/Emitter.js"

export default function emittable(item, options) {
  if (!item) return new Emitter(options)

  const events = options?.events
    ? Object.assign(Object.create(null), options.events)
    : Object.create(null)

  Object.defineProperty(item, Emitter.EVENTS, { value: events, writable: true })
  for (const key of Object.getOwnPropertyNames(Emitter.prototype)) {
    if (key !== "constructor" && key in item === false) {
      Object.defineProperty(item, key, {
        value: Emitter.prototype[key],
        writable: true,
      })
    }
  }

  options?.signal?.addEventListener("abort", () => {
    this.off("*")
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
