import ensureElement from "./ensureElement.js"
import Emitter from "../classes/Emitter.js"

const _EVENTS = Symbol.for("Emitter.EVENTS")

const emitters = new WeakMap()

function makeEmitter(parent) {
  const emitter = new Emitter()

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.removedNodes.length > 0) emitter.emit("removed")
    }
  })

  observer.observe(parent, { childList: true })
  emitter.observer = observer
  return emitter
}

export async function untilElementRemove(el) {
  el = ensureElement(el)
  if (!el.isConnected) return el

  let emitter = emitters.get(el.parentElement)
  if (!emitter) {
    emitter = makeEmitter(el.parentElement)
    emitters.set(el.parentElement, emitter)
  }

  return new Promise((resolve) => {
    const off = emitter.on("removed", { off: true }, () => {
      if (!el.isConnected) {
        resolve(el)
        off()
        if (emitter[_EVENTS].removed.length === 0) {
          emitter.observer.disconnect()
          emitters.delete(el.parentElement)
        }
      }
    })
  })
}

export default untilElementRemove
