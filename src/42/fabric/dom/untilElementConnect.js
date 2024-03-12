import ensureElement from "./ensureElement.js"
import Emitter from "../classes/Emitter.js"

const emitters = new WeakMap()

function makeEmitter(parent) {
  const emitter = new Emitter()

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.addedNodes.length > 0) emitter.emit("connect")
    }
  })

  observer.observe(parent, { childList: true, subtree: true })
  emitter.observer = observer
  return emitter
}

/**
 * Returns a Promise that resolve when the element is connected to the DOM
 *
 * @param {string | HTMLElement} el
 * @returns {Promise<HTMLElement>}
 */
export async function untilElementConnect(el) {
  el = ensureElement(el)
  if (el.isConnected) return el

  let emitter = emitters.get(document.documentElement)
  if (!emitter) {
    emitter = makeEmitter(document.documentElement)
    emitters.set(document.documentElement, emitter)
  }

  return new Promise((resolve) => {
    const off = emitter.on("connect", { off: true }, () => {
      if (el.isConnected) {
        resolve(el)
        off()
        if ("connect" in emitter[Emitter.EVENTS]) {
          emitter.observer.disconnect()
          emitters.delete(document.documentElement)
        }
      }
    })
  })
}

export default untilElementConnect
