import fs from "./fs.js"
import disk from "./disk.js"
import normalizeFilename from "./fs/normalizeFilename.js"
import dispatch from "../fabric/event/dispatch.js"
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

persist.watch = (path, fn) =>
  disk.watch(path, (...args) => {
    if (!pending.has(path)) fn(...args)
  })

persist.has = (path) => disk.has(normalizeFilename(path))

persist.get = async (path) => fs.read[persist.ensureType(path)](path)

persist.set = async (path, data) => {
  if (pending.has(path)) {
    const { id, resolve } = pending.get(path)
    cancelIdleCallback(id)
    resolve(false)
    pending.delete(path)
  }

  return new Promise((resolve) => {
    const fn = async () => {
      try {
        await fs.write[persist.ensureType(path)](path, data)
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
    const id = requestIdleCallback(fn, { timeout: 5000 })
    pending.set(path, { id, resolve, fn })
  })
}

const handler = (e) => {
  if (pending.size > 0) {
    queueMicrotask(() => {
      // force saving
      for (const { id, fn } of pending.values()) {
        cancelIdleCallback(id)
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
