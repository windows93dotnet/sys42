import fs from "./fs.js"
import systemPath from "./fs/systemPath.js"
import disk from "./fs/disk.js"

if ("requestIdleCallback" in globalThis === false) {
  await import("./env/polyfills/globalThis.requestIdleCallback.js")
}

const pending = new Map()

const persist = {}

persist.has = (path) => disk.has(systemPath(path))

persist.load = async (path) => fs.readJSON(systemPath(path))

persist.save = (path, data) =>
  new Promise((resolve, reject) => {
    if (pending.has(path)) {
      const fn = pending.get(path)
      cancelIdleCallback(fn.id)
      pending.delete(path)
    }

    const fn = async () => {
      try {
        await fs.writeJSON(systemPath(path), data)
      } catch (err) {
        reject(err)
      }

      pending.delete(path)
      resolve()
    }

    fn.id = requestIdleCallback(fn)
    pending.set(path, fn)
  })

export default persist

const beforeUnload = (e) => {
  if (pending.size > 0) {
    queueMicrotask(() => {
      // force blocking ui saving
      for (const fn of pending.values()) {
        cancelIdleCallback(fn.id)
        fn()
      }

      pending.clear()
    })
    e.preventDefault()
    e.returnValue = "Changes you made may not be saved."
    return e.returnValue
  }
}

globalThis.addEventListener("beforeunload", beforeUnload, { capture: true })
