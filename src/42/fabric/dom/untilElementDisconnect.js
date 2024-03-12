import ensureElement from "./ensureElement.js"
import Emitter from "../classes/Emitter.js"

const emitters = new WeakMap()

function makeEmitter(parent) {
  const emitter = new Emitter()

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.removedNodes.length > 0) emitter.emit("disconnect")
    }
  })

  observer.observe(parent, { childList: true })
  emitter.observer = observer
  return emitter
}

/**
 * Returns a Promise that resolve when the element is disconnected from the DOM
 *
 * @param {string | HTMLElement} el
 * @returns {Promise<HTMLElement>}
 */
export async function untilElementDisconnect(el) {
  el = ensureElement(el)
  if (!el.isConnected) return el

  let emitter = emitters.get(el.parentElement)
  if (!emitter) {
    emitter = makeEmitter(el.parentElement)
    emitters.set(el.parentElement, emitter)
  }

  return new Promise((resolve) => {
    const off = emitter.on("disconnect", { off: true }, () => {
      if (!el.isConnected) {
        resolve(el)
        off()
        if ("disconnect" in emitter[Emitter.EVENTS]) {
          emitter.observer.disconnect()
          emitters.delete(el.parentElement)
        }
      }
    })
  })
}

export default untilElementDisconnect
