import fs from "./fs.js"
import dispatch from "../fabric/event/dispatch.js"
import systemPath from "./fs/systemPath.js"
import disk from "./disk.js"
import getExtname from "./path/core/getExtname.js"

if ("requestIdleCallback" in globalThis === false) {
  await import("./env/polyfills/globalThis.requestIdleCallback.js")
}

const VALID_TYPES = new Set([".json", ".json5", ".cbor"])

const pending = new Map()

const persist = {}
export default persist

persist.ensureType = (path) => {
  const ext = getExtname(path)
  if (!VALID_TYPES.has(ext)) {
    throw new Error(
      `Data file must have a .json, .json5 or .cbor extension: ${ext}`
    )
  }

  return ext.slice(1)
}

persist.has = (path) => disk.has(systemPath(path))

persist.watch = (path, fn) => disk.watch(path, fn)

persist.get = async (path) =>
  fs.read[persist.ensureType(path)](systemPath(path))

persist.set = (path, data) => {
  if (pending.has(path)) {
    const { id, resolve } = pending.get(path)
    cancelIdleCallback(id)
    resolve(false)
    pending.delete(path)
  }

  return new Promise((resolve) => {
    const fn = async () => {
      try {
        await fs.write[persist.ensureType(path)](systemPath(path), data)
      } catch (err) {
        dispatch(globalThis, err)
        resolve(false)
        return
      }

      pending.delete(path)
      if (isListening && pending.size === 0) forget()
      resolve(true)
    }

    if (!isListening) listen()
    const id = requestIdleCallback(fn)
    pending.set(path, { id, resolve })
  })
}

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
