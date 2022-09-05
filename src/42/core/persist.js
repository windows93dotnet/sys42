import fs from "./fs.js"
import systemPath from "./fs/systemPath.js"
import disk from "./disk.js"

if ("requestIdleCallback" in globalThis === false) {
  await import("./env/polyfills/globalThis.requestIdleCallback.js")
}

const pending = new Map()

const persist = {}

persist.has = (path) => disk.has(systemPath(path))

persist.get = async (path) => fs.readJSON(systemPath(path))

persist.set = (path, data) =>
  new Promise((resolve, reject) => {
    if (pending.has(path)) {
      const fn = pending.get(path)
      cancelIdleCallback(fn.id)
      pending.delete(path)
    }

    const fn = async () => {
      try {
        console.log(path, "writeJSON")
        await fs.writeJSON(systemPath(path), data)
      } catch (err) {
        reject(err)
      }

      pending.delete(path)
      if (isListening && pending.size === 0) forget()
      resolve()
    }

    if (!isListening) listen()
    fn.id = requestIdleCallback(fn)
    pending.set(path, fn)
  })

export default persist

const handler = (e) => {
  if (pending.size > 0) {
    queueMicrotask(() => {
      // force saving
      for (const fn of pending.values()) {
        cancelIdleCallback(fn.id)
        fn()
      }

      pending.clear()
      if (isListening) forget()
    })
    e.preventDefault()
    e.returnValue = "Changes you made may not be saved."
    return e.returnValue
  }
}

const options = { capture: true }
let isListening = false

const listen = () => {
  isListening = true
  globalThis.addEventListener("beforeunload", handler, options)
}

const forget = () => {
  isListening = false
  globalThis.removeEventListener("beforeunload", handler, options)
}
