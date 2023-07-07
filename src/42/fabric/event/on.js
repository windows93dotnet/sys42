/* eslint-disable max-params */
import { normalizeListen, makeHandler } from "./listen.js"
import queueTask from "../type/function/queueTask.js"
import keyboard from "../../core/devices/keyboard.js"
import ensureFocusable from "../dom/ensureFocusable.js"

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

      if (buffer === "Enter") item.key = "enter"
      else if (buffer === "Return") {
        item.key = "enter"
        item.code = "Enter"
      } else if (
        codes.has(buffer) ||
        buffer.startsWith("Key") ||
        buffer.startsWith("Digit") ||
        buffer.startsWith("Numpad")
      ) {
        item.code = buffer
      } else {
        item.key = buffer.toLocaleLowerCase()
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
  const registry = {
    chordCalled: false,
    seqIndex: 0,
  }

  for (const { el, listeners } of list) {
    for (const item of listeners) {
      const sorted = Object.entries(item.events).sort(([a], [b]) =>
        a.length === b.length ? 0 : a.length > b.length ? -1 : 1,
      )
      for (let [key, fn] of sorted) {
        fn = makeHandler(item, fn)
        for (const seq of parseShortcut(key)) {
          handleSeq(seq, fn, el, item, registry)
        }
      }
    }
  }
}

function handleSeq(seq, fn, el, { repeatable, options }, registry) {
  if (seq.length > 1) {
    const run = fn
    fn = (e) => {
      queueTask(() => {
        if (++registry.seqIndex === seq.length) {
          run(e)
          registry.seqIndex = 0
        }
      })
    }
  }

  for (let i = 0, l = seq.length; i < l; i++) {
    const chords = seq[i]
    const events = {}
    const chordCalls = []
    const eventOptions = { ...options }

    for (const { event, key, code } of chords) {
      if (event in events === false) {
        if ((key || code) && !keyboard.isListening) keyboard.listen()
        if (chords.length > 1) {
          ensureFocusable(el, { signal: options.signal, tabIndex: -1 })
          eventOptions.capture = true
          events[event] = (e) => {
            if (chordCalls.length === 0) {
              // eslint-disable-next-line guard-for-in
              for (const key in keyboard.keys) {
                chordCalls.push({ type: "keydown", key })
              }
            }

            if (registry.seqIndex !== i) return
            if (e.repeat && repeatable !== true) return

            for (let i = 0, l = chordCalls.length; i < l; i++) {
              if (
                chordCalls[i].key === undefined ||
                chordCalls[i].key in keyboard.keys === false
              ) {
                chordCalls.length = i
                break
              }
            }

            chordCalls.push({
              type: e.type,
              key: e.key?.toLocaleLowerCase(),
              code: e.code,
            })

            for (let i = 0, l = chords.length; i < l; i++) {
              const chord = chords[i]
              if (
                i in chordCalls === false ||
                chordCalls[i].type !== chord.event ||
                ("key" in chord && chordCalls[i].key !== chord.key) ||
                ("code" in chord && chordCalls[i].code !== chord.code)
              ) {
                chordCalls.length = i
                registry.seqIndex = 0
                return
              }
            }

            registry.chordCalled = true

            queueTask(() => {
              registry.chordCalled = false
            })

            fn(e)
          }
        } else if (key || code) {
          ensureFocusable(el, { signal: options.signal, tabIndex: -1 })
          events[event] = (e) => {
            chordCalls.length = 0
            if (registry.seqIndex !== i) return
            if (registry.chordCalled) return
            if (e.repeat && repeatable !== true) return
            if (e.code === code || e.key.toLocaleLowerCase() === key) fn(e)
            else registry.seqIndex = 0
          }
        } else {
          events[event] = (e) => {
            chordCalls.length = 0
            if (registry.seqIndex !== i) return
            if (registry.chordCalled) return
            fn(e)
          }
        }
      }
    }

    for (const [event, fn] of Object.entries(events)) {
      el.addEventListener(event, fn, eventOptions)
    }
  }
}

export function on(...args) {
  const { list, cancels } = normalizeListen(args)
  eventsMap(list)
  if (cancels) {
    const forget = () => {
      for (const cancel of cancels) cancel()
    }

    forget.destroy = forget
    return forget
  }
}

export { normalizeListen, makeHandler, SPLIT_REGEX } from "./listen.js"

export default on
