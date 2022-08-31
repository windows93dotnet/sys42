import { normalizeListen, delegate, handler } from "./listen.js"

const DEFAULTS = {
  passive: false,
  capture: false,
  once: false,
  signal: undefined,
}

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

export function parseShortcut(source) {
  let buffer = ""
  let current = 0

  const tokens = [[[]]]

  let or = 0
  let sequence = 0

  const flush = () => {
    tokens[or] ??= []
    tokens[or][sequence] ??= []

    if (buffer.length > 1 && buffer.toLowerCase() === buffer) {
      tokens[or][sequence].push({ event: buffer })
    } else {
      if (buffer in aliases) buffer = aliases[buffer]
      tokens[or][sequence].push({
        event: "keydown",
        key: buffer,
        code: buffer.length === 1 ? undefined : buffer,
      })
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
  for (let { selector, events, options } of listeners) {
    options = { ...DEFAULTS, ...options }
    for (let [key, fn] of Object.entries(events)) {
      fn = selector ? delegate(selector, fn) : handler(fn)
      for (const seq of parseShortcut(key)) handleSeq(seq, fn, el, options)
    }
  }
}

function handleSeq(seq, fn, el, options) {
  for (let i = 0, l = seq.length; i < l; i++) {
    const choord = seq[i]

    const activeChoords = new Array(choord.length)

    for (let j = 0, l = choord.length; j < l; j++) {
      const { event, key, code } = choord[j]
      let exec = fn

      if (choord.length > 1) {
        exec = (e) => {
          activeChoords[j] = true
          for (const active of activeChoords) if (!active) return
          activeChoords.fill(false)
          fn(e)
        }
      }

      if (key || code) {
        const check = exec
        exec = (e) => (e.key === key || e.code === code) && check(e)
      }

      el.addEventListener(event, exec, options)
    }
  }
}

export default function on(...args) {
  const { list, cancels } = normalizeListen(args)
  for (const item of list) eventsMap(item)
  if (cancels) {
    return () => {
      for (const cancel of cancels) cancel()
    }
  }
}
