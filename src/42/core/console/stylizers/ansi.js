// @thanks https://github.com/chalk/chalk

import chainable from "../../../fabric/traits/chainable.js"
// import toggleable from "../../../fabric/traits/toggleable.js"
import SGR from "../../../fabric/constants/SGR.js"
import Color from "../../../fabric/class/Color.js"

const capitalize = (word) => word[0].toUpperCase() + word.slice(1)

// create chalk like aliases
const ALIASES = {}

for (const [key, value] of Object.entries(SGR.BRIGHT)) {
  ALIASES[`${key}Bright`] = value
}

for (const [key, value] of Object.entries(SGR.BG)) {
  ALIASES[`bg${capitalize(key)}`] = value
}

for (const [key, value] of Object.entries(SGR.BG_BRIGHT)) {
  ALIASES[`bg${capitalize(key)}Bright`] = value
}

const states = {
  NORMAL: { ...ALIASES, ...SGR.STYLES, ...SGR.COLORS },
  BRIGHT: { ...ALIASES, ...SGR.STYLES, ...SGR.BRIGHT },
  BG: { ...ALIASES, ...SGR.STYLES, ...SGR.BG },
  BG_BRIGHT: { ...ALIASES, ...SGR.STYLES, ...SGR.BG_BRIGHT },
}

const GETTERS = ["bg", "bright", ...Object.keys(states.NORMAL)]

const color = ({ entries }, color) => {
  entries.push(["color", new Color(color, { compact: true })])
}

const ansi = chainable(GETTERS, color, ({ entries }, str) => {
  if (ansi.enabled === false || !str) return str

  let modified

  const setOpen = new Set()
  const setClose = new Set()

  let state = states.NORMAL

  for (const [key, val] of entries) {
    if (key === "bright") {
      state = state === states.BG ? states.BG_BRIGHT : states.BRIGHT
    } else if (key === "bg") {
      state = state === states.BRIGHT ? states.BG_BRIGHT : states.BG
    } else if (key === "color") {
      modified = true
      const color = val
      if (state === states.BG) {
        setOpen.add(`48;2;${color.r};${color.g};${color.b}`)
        setClose.add("49")
      } else {
        setOpen.add(`38;2;${color.r};${color.g};${color.b}`)
        setClose.add("39")
      }

      state = states.NORMAL
    } else {
      modified = true
      setOpen.add(state[key][0])
      setClose.add(state[key][1])
      state = states.NORMAL
    }
  }

  if (modified !== true) return str

  let open = ""
  let close = ""

  const arrayOpen = [...setOpen]
  const arrayClose = [...setClose]

  open = `\x1b[${arrayOpen.join(";")}m`
  close = `\x1b[${arrayClose.reverse().join(";")}m`

  return str
    .split("\n")
    .map((x) => (x ? `${open}${x}${close}` : ""))
    .join("\n")
})

// toggleable(ansi)
ansi.isDevtool = false
ansi.isAnsi = true

export default ansi
