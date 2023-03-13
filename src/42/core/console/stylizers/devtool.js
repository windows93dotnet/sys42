import settings from "../../settings.js"
import chainable from "../../../fabric/traits/chainable.js"
import Color from "../../../fabric/classes/Color.js"

const capitalize = (word) => word[0].toUpperCase() + word.slice(1)

const DEFAULTS = {
  css: document.fonts.check("8px tomo")
    ? "font: 8px/12px tomo, monospace;"
    : "",
  colors: {
    // TODO: fix dim as the only color indication
    dim: "rgba(0,160,160,0.8)", // should work on light and dark theme

    black: "#232634",
    blackBright: "#6e7483",

    red: "#ff5c57",
    redBright: "#f0562c",

    green: "#5af78e",
    greenBright: "#00ff9a",

    yellow: "#ccc47a",
    yellowBright: "#dabd3f",

    blue: "#57c7ff",
    blueBright: "#2a9bff",

    magenta: "#ff6ac1",
    magentaBright: "#b280f6",

    cyan: "#9aedfe",
    cyanBright: "#0ff",

    white: "#d4d4c4",
    whiteBright: "#fff",
  },
}

const configure = settings("devtool", DEFAULTS)

const ALIASES = {}
const ALIASES_DIM = {}
const SGR = {
  STYLES: {
    hidden: "",
    inverse: "",
    reset: "",
    italic: "font-style:italic;",
    strikethrough: "text-decoration:line-through;",
    bold: "font-weight:bold;",
    underline: "border-bottom:1px solid;",
  },
  COLORS: {},
  BRIGHT: {},
  DIM: {},
  DIM_BRIGHT: {},
  BG: {},
  BG_BRIGHT: {},
}

SGR.STYLES.del = SGR.STYLES.strikethrough

let colors
let states

const setColors = (...options) => {
  colors = {}

  const computedStyle = getComputedStyle(document.documentElement)
  for (const [key, value] of Object.entries(DEFAULTS.colors)) {
    // get ansi css variables if defined
    const cssValue = computedStyle.getPropertyValue(`--ansi-${key}`)
    colors[key] = cssValue ? cssValue.trim() : value
  }

  Object.assign(colors, ...options)
}

const setStates = () => {
  // gray/grey aliases
  colors.gray = colors.blackBright
  colors.grey = colors.blackBright
  colors.grayBright = colors.blackBright
  colors.greyBright = colors.blackBright

  for (const [key, value] of Object.entries(colors)) {
    const bg = `background-color:${value};`
    const styles = `color:${value};`
    const dim = `color:${new Color(value, { compact: true }).setAlpha(0.5)};`
    if (key.includes("Bright")) {
      const prefix = key.slice(0, -6)
      SGR.BRIGHT[prefix] = styles
      SGR.BG_BRIGHT[prefix] = bg
      SGR.DIM_BRIGHT[prefix] = dim
      ALIASES[key] = styles
      ALIASES_DIM[key] = dim
    } else {
      SGR.COLORS[key] = styles
      SGR.BG[key] = bg
      SGR.DIM[key] = dim
    }

    ALIASES[`bg${capitalize(key)}`] = bg
  }

  states = {
    NORMAL: { ...ALIASES, ...SGR.STYLES, ...SGR.COLORS },
    BRIGHT: { ...ALIASES, ...SGR.STYLES, ...SGR.BRIGHT },
    DIM: { ...ALIASES_DIM, ...SGR.STYLES, ...SGR.DIM },
    DIM_BRIGHT: { ...ALIASES_DIM, ...SGR.STYLES, ...SGR.DIM_BRIGHT },
    BG: { ...ALIASES, ...SGR.STYLES, ...SGR.BG },
    BG_BRIGHT: { ...ALIASES, ...SGR.STYLES, ...SGR.BG_BRIGHT },
  }
}

const colorsKeys = [
  "gray",
  "grey",
  "grayBright",
  "greyBright",
  ...Object.keys(DEFAULTS.colors),
]

const GETTERS = [
  "bg",
  "bright",
  ...Object.keys(SGR.STYLES),
  ...colorsKeys,
  ...colorsKeys.map((key) => `bg${capitalize(key)}`),
]

GETTERS.splice(GETTERS.indexOf("bgDim"), 1)

const color = ({ entries }, color) => {
  entries.push(["color", new Color(color, { compact: true })])
}

const devtool = chainable(GETTERS, color, ({ entries }, str) => {
  str = str.replaceAll("%", "%%")
  if (devtool.enabled === false || !str) return [str, ""]

  let state = "dim" in Object.fromEntries(entries) ? states.DIM : states.NORMAL

  let openCss = devtool.config.css

  for (const [key, val] of entries) {
    if (key === "bright" || key === "bold") {
      state =
        state === states.BG
          ? states.BG_BRIGHT
          : state === states.DIM
          ? states.DIM_BRIGHT
          : states.BRIGHT
      if (key === "bright") continue
    }

    if (key === "bg") {
      state = state === states.BRIGHT ? states.BG_BRIGHT : states.BG
      continue
    }

    if (key === "dim") {
      // openCss += state[key]
      state = state === states.BRIGHT ? states.DIM_BRIGHT : states.DIM
      continue
    }

    if (key === "color") {
      openCss +=
        state === states.BG || state === states.BG_BRIGHT
          ? `background-color:${val};`
          : `color:${val};`
    } else if (state[key]) {
      openCss += state[key]
    }

    state = states.NORMAL
  }

  return [`%c${str}`, openCss]
})

devtool.configure = (options) => {
  devtool.config = configure(options)
  setColors(options?.colors)
  setStates()
}

devtool.configure()

devtool.isDevtool = true
devtool.isAnsi = false

export default devtool
