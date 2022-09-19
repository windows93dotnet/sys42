/* eslint-disable guard-for-in */
const aliases = {}

for (const item of [
  "⌫ Backspace",
  "↲ ↩︎ Enter",
  "⇧ Shift",
  "⇫ Caps CapsLock",
  "↹ Tab",
  "⌥ Option Alt",
  "⌃ ^ Ctrl Control",
  "⌘ 🐧 🪟 🍎 🍏 🍐 ♥ Cmd Win Super Command OS Meta",
  "⇞ PgUp PageUp",
  "⇟ PgDn PgDown PageDown",
  "↖ Home",
  "↘ End",
  "← Left ArrowLeft",
  "↑ Up ArrowUp",
  "→ Right ArrowRight",
  "↓ Down ArrowDown",
  "⎵ SpaceBar Space  ",
  "Del Delete",
  "Ins Insert",
  "⎙ Print PrintScreen",
  "☰ Menu ContextMenu",
  "⤓ ⇳ ScrollLock",
  "AltGr AltGraph",
  "Break Pause",
  "Esc Escape",
  "Multiply *",
  "Plus Add +",
  "Minus Sub Subtract -",
  "Dot Decimal Period .",
  "Divide Slash /",
  "Backslash \\",
  "Equals Equal =",
  "Semicolon ;",
  "Comma ,",
  "Hash Sharp Hashtag Octothorpe #",
]) {
  const t = item.split(" ")
  const ref = t[t.length - 1] || " "
  for (let j = 0, m = t.length; j < m; j++) aliases[t[j].toLowerCase()] = ref
}

// fill function keys
for (let i = 1; i <= 12; i++) aliases["f" + i] = "F" + i

const keys = Object.create(null)
const codes = Object.create(null)
const strokes = Object.create(null)

const keydown = ({ key, code, repeat }) => {
  if (repeat === false) {
    codes[code] = true
    keys[key] = true
    // allow keyup event to remove a "key" from it's "code"
    strokes[code] ??= { counter: 0, keys: [] }
    strokes[code].counter++
    strokes[code].keys.push(key)
  }
}

const keyup = ({ code }) => {
  // allow non-capturing events to access "code"
  // before removing it from "codes" and "strokes"
  queueMicrotask(() => {
    delete codes[code]
    if (strokes[code]) {
      strokes[code].keys.forEach((key) => delete keys[key])
      strokes[code].counter--
      if (strokes[code].counter === 0) strokes[code].keys.length = 0
    }
  })
}

// the keyup event is not called if a keydown shortcut
// call a function that focus outside the document (like alert()).
// We must clean all pressed keys on blur.
const cleanup = () => {
  for (const key in keys) delete keys[key]
  for (const key in codes) delete codes[key]
  for (const key in strokes) delete strokes[key]
  globalThis.addEventListener("pointerdown", pressedMods, { once: true })
}

// Register modifier keys pressed before the window is focused
const pressedMods = (e) => {
  if (e.ctrlKey && "Control" in keys === false) keys.Control = true
  if (e.shiftKey && "Shift" in keys === false) keys.Shift = true
  if (e.metaKey && "Meta" in keys === false) keys.Meta = true
  if (e.altKey && "Alt" in keys === false) keys.Alt = true
}

export const forget = () => {
  globalThis.removeEventListener("keydown", keydown, true)
  globalThis.removeEventListener("keyup", keyup, true)
  globalThis.removeEventListener("blur", cleanup)
  globalThis.removeEventListener("pointerdown", pressedMods, { once: true })
  keyboard.isListening = false
}

export const listen = () => {
  if (keyboard.isListening) return forget
  globalThis.addEventListener("keydown", keydown, true /* [1] */)
  globalThis.addEventListener("keyup", keyup, true /* [1] */)
  globalThis.addEventListener("blur", cleanup /* [2] */)
  globalThis.addEventListener("pointerdown", pressedMods, { once: true })
  keyboard.isListening = true
  return forget
}

// [1] Use capture to prevent canceled events to impact "keys" and "codes".
// [2] "blur" event don't bubble, so no capture.

const keyboard = {
  keys,
  codes,
  aliases,
  cleanup,
  listen,
  forget,
  isListening: false,
}

export default keyboard
