import { normalizeListen, delegate, handler } from "./listen.js"
import keyboard from "../../core/devices/keyboard.js"

const aliases = {
  Ctrl: "Control",
  Down: "ArrowDown",
  Left: "ArrowLeft",
  Right: "ArrowRight",
  Up: "ArrowUp",
  AltGr: "AltGraph",
  Del: "Delete",
  Esc: "Escape",
}

const codes = new Set([
  "ShiftLeft",
  "ShiftRight",
  "ControlLeft",
  "ControlRight",
  "AltLeft",
  "AltRight",
  "MetaLeft",
  "MetaRight",
  "Space",
  "Semicolon",
  "Equal",
  "Comma",
  "Minus",
  "Period",
  "Slash",
  "Backquote",
  "BracketLeft",
  "Backslash",
  "BracketRight",
  "Quote",
])

const itemKeys = ["selector", "returnForget", "preventDefault", "repeatable"]

export function parseShortcut(source) {
  let buffer = ""
  let current = 0

  const tokens = [[[]]]

  let or = 0
  let sequence = 0

  const flush = () => {
    tokens[or] ??= []
    tokens[or][sequence] ??= []

    if (
      buffer.length > 1 &&
      (buffer.toLowerCase() === buffer || buffer === "DOMContentLoaded")
    ) {
      tokens[or][sequence].push({ event: buffer })
    } else {
      if (buffer in aliases) buffer = aliases[buffer]
      const item = { event: "keydown" }
      if (buffer.length === 1 || buffer === "Enter") item.key = buffer
      else if (
        codes.has(buffer) ||
        buffer.startsWith("Key") ||
        buffer.startsWith("Digit") ||
        buffer.startsWith("Numpad")
      ) {
        item.code = buffer
      } else if (buffer === "Return") {
        item.key = "Enter"
        item.code = "Enter"
      } else {
        item.key = buffer
      }

      tokens[or][sequence].push(item)
    }

    buffer = ""
  }

  while (current < source.length) {
    const char = source[current]

    if (char === " ") {
      let advance = 1
      let next = source[current + advance]
      while (next === " ") {
        advance++
        next = source[current + advance]
      }

      if (!(next === "|" && source[current + advance + 1] === "|")) {
        flush()
        sequence++
      }

      current += advance
      continue
    }

    if (char === "|" && source[current + 1] === "|") {
      let advance = 2
      let next = source[current + advance]
      while (next === " ") {
        advance++
        next = source[current + advance]
      }

      flush()
      or++
      current += advance
      continue
    }

    if (char === "+") {
      flush()
      current++

      if (source[current] === "+") {
        buffer = "+"
        current++
      }

      continue
    }

    buffer += char
    current++
  }

  flush()

  return tokens
}

export const eventsMap = ({ el, listeners }) => {
  for (const item of listeners) {
    for (let [key, fn] of Object.entries(item.events)) {
      fn = item.selector ? delegate(item.selector, fn) : handler(fn)
      for (const seq of parseShortcut(key)) handleSeq(seq, fn, el, item)
    }
  }
}

function handleSeq(seq, fn, el, { repeatable, options }) {
  for (let i = 0, l = seq.length; i < l; i++) {
    const choords = seq[i]

    for (let j = 0, l = choords.length; j < l; j++) {
      const { event, key, code } = choords[j]
      let exec = fn

      if (key || code) {
        if (!keyboard.isListening) keyboard.listen()
        if (choords.length > 1) {
          const run = exec
          exec = (e) => {
            if (e.repeat && repeatable !== true) return
            for (const choord of choords) {
              if ("key" in choord && !keyboard.keys[choord.key]) return
              if ("code" in choord && !keyboard.codes[choord.code]) return
            }

            e.stopImmediatePropagation()

            run(e)
          }
        } else {
          const run = exec
          exec = (e) => {
            if (e.repeat && repeatable !== true) return
            if (e.key === key || e.code === code) run(e)
          }
        }
      }

      el.addEventListener(event, exec, options)
    }
  }
}

export default function on(...args) {
  const { list, cancels } = normalizeListen(args, { itemKeys })
  for (const item of list) eventsMap(item)
  if (cancels) {
    return () => {
      for (const cancel of cancels) cancel()
    }
  }
}

export { normalizeListen, delegate, handler } from "./listen.js"
