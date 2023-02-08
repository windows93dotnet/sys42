/* eslint-disable guard-for-in */

const keys = Object.create(null)
const codes = Object.create(null)
const strokes = Object.create(null)

const keydown = (e) => {
  let { key, code, repeat } = e
  if (repeat === false) {
    if (e.ctrlKey) keys.control = true
    if (e.shiftKey) keys.shift = true
    if (e.metaKey) keys.meta = true
    if (e.altKey) keys.alt = true

    key = key.toLocaleLowerCase()
    keys[key] = true
    codes[code] = true
    // Allow keyup event to remove a "key" from it's "code"
    strokes[code] ??= { counter: 0, keys: [] }
    strokes[code].counter++
    strokes[code].keys.push(key)
  }
}

const keyup = (e) => {
  const { code } = e
  // Allow non-capturing events to access keyboard.codes before cleanup
  queueMicrotask(() => {
    if (!e.ctrlKey) delete keys.control
    if (!e.shiftKey) delete keys.shift
    if (!e.metaKey) delete keys.meta
    if (!e.altKey) delete keys.alt

    delete codes[code]
    if (strokes[code]) {
      strokes[code].keys.forEach((key) => delete keys[key])
      strokes[code].counter--
      if (strokes[code].counter === 0) strokes[code].keys.length = 0
    }
  })
}

// The keyup event is not called if a keydown shortcut
// set the focus outside the document.
// We must clean all pressed keys on blur.
const cleanup = () => {
  for (const key in keys) delete keys[key]
  for (const key in codes) delete codes[key]
  for (const key in strokes) delete strokes[key]
}

export const forget = () => {
  globalThis.removeEventListener("keydown", keydown, true)
  globalThis.removeEventListener("keyup", keyup, true)
  globalThis.removeEventListener("blur", cleanup)
  keyboard.isListening = false
}

export const listen = () => {
  if (keyboard.isListening) return forget
  globalThis.addEventListener("keydown", keydown, true /* [1] */)
  globalThis.addEventListener("keyup", keyup, true /* [1] */)
  globalThis.addEventListener("blur", cleanup)
  keyboard.isListening = true
  return forget
}

// [1] Use capture to prevent canceled events to impact "keys" and "codes".

const keyboard = {
  keys,
  codes,
  cleanup,
  listen,
  forget,
  isListening: false,
}

export default keyboard
