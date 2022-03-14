import Emitter from "../class/Emitter.js"

export default function emittable(item, events = Object.create(null)) {
  if (!item) return new Emitter(events)

  Object.defineProperty(item, Emitter.EVENTS, { value: events, writable: true })
  for (const key of Object.getOwnPropertyNames(Emitter.prototype)) {
    if (key !== "constructor" && key in item === false) {
      Object.defineProperty(item, key, { value: Emitter.prototype[key] })
    }
  }

  return item
}

emittable.EVENTS = Emitter.EVENTS
