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
    if (!buffer) return
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
      if (!buffer) buffer = "+"
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

export const eventsMap = (list) => {
  for (const { el, listeners } of list) {
    for (const item of listeners) {
      const sorted = Object.entries(item.events).sort(([a], [b]) =>
        a.length === b.length ? 0 : a.length > b.length ? -1 : 1
      )
      for (let [key, fn] of sorted) {
        fn = item.selector ? delegate(item.selector, fn) : handler(fn)
        for (const seq of parseShortcut(key)) handleSeq(seq, fn, el, item)
      }
    }
  }
}

function handleSeq(seq, fn, el, { repeatable, options }) {
  for (let i = 0, l = seq.length; i < l; i++) {
    const choords = seq[i]
    const events = {}
    const choordCalls = []
    for (const { event, key, code } of choords) {
      if (event in events === false) {
        if ((key || code) && !keyboard.isListening) keyboard.listen()
        if (choords.length > 1) {
          events[event] = (e) => {
            if (e.repeat && repeatable !== true) return
            choordCalls.push(e.type)
            for (const choord of choords) {
              if (!choordCalls.includes(choord.event)) return
              if ("key" in choord && !keyboard.keys[choord.key]) return
              if ("code" in choord && !keyboard.codes[choord.code]) return
            }

            choordCalls.length = 0
            fn(e)
          }
        } else if (key || code) {
          events[event] = (e) => {
            if (e.repeat && repeatable !== true) return
            if (e.key === key || e.code === code) {
              fn(e)
            }
          }
        } else {
          events[event] = (e) => {
            fn(e)
          }
        }
      }
    }

    for (const [event, fn] of Object.entries(events)) {
      el.addEventListener(event, fn, options)
    }
  }
}

export default function on(...args) {
  const { list, cancels } = normalizeListen(args, { itemKeys })
  eventsMap(list)
  if (cancels) {
    return () => {
      for (const cancel of cancels) cancel()
    }
  }
}

export { normalizeListen, delegate, handler } from "./listen.js"
