import fs from "./fs.js"
import systemPath from "./fs/systemPath.js"
import dispatch from "../fabric/dom/dispatch.js"
import disk from "./fs/disk.js"

if ("requestIdleCallback" in globalThis === false) {
  await import("./env/polyfills/globalThis.requestIdleCallback.js")
}

const pending = new Map()

export default function persist(path, data) {
  if (pending.has(path)) {
    const fn = pending.get(path)
    cancelIdleCallback(fn.id)
    pending.delete(path)
  }

  const fn = async () => {
    try {
      await fs.writeJSON(systemPath(path), data)
    } catch (err) {
      dispatch(globalThis, err)
    }

    pending.delete(path)
  }

  fn.id = requestIdleCallback(fn)
  pending.set(path, fn)
}

persist.has = (path) => disk.has(systemPath(path))

persist.load = async (path) => fs.readJSON(systemPath(path))

const beforeUnload = (e) => {
  if (pending.size > 0) {
    e.preventDefault()
    e.returnValue = "Changes you made may not be saved."
    return e.returnValue
  }
}

globalThis.addEventListener("beforeunload", beforeUnload, { capture: true })
