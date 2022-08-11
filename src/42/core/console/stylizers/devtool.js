import inWorker from "../../env/realm/inWorker.js"
import inView from "../../env/realm/inView.js"
import inOpaqueOrigin from "../../env/realm/inOpaqueOrigin.js"
import setup from "../../../core/setup.js"
// import toggleable from "../../../fabric/traits/toggleable.js"
import chainable from "../../../fabric/traits/chainable.js"
import Color from "../../../fabric/class/Color.js"

const capitalize = (word) => word[0].toUpperCase() + word.slice(1)

const DEFAULTS = {
  css: "font: 8px/12px tomo, monospace;",
  colors: {
    // Visual Studio Code colors
    // @src https://en.wikipedia.org/wiki/ANSI_escape_code#3-bit_and_4-bit
    dim: "rgba(160,160,160,0.8)", // should work on light and dark theme
    // black: "rgb(0,0,0)",
    // red: "rgb(205,49,49)",
    // green: "rgb(13,188,121)",
    // yellow: "rgb(229,229,16)",
    // blue: "rgb(36,114,200)",
    // magenta: "rgb(188,63,188)",
    // cyan: "rgb(17,168,205)",
    // white: "rgb(229,229,229)",
    // blackBright: "rgb(102,102,102)",
    // redBright: "rgb(241,76,76)",
    // greenBright: "rgb(35,209,139)",
    // yellowBright: "rgb(245,245,67)",
    // blueBright: "rgb(59,142,234)",
    // magentaBright: "rgb(214,112,214)",
    // cyanBright: "rgb(41,184,219)",
    // whiteBright: "rgb(229,229,229)",

    black: "#232634",
    blackBright: "#616673",

    red: "#ff5c57",
    redBright: "#f0562c",

    green: "#5af78e",
    greenBright: "#00ff9a",

    yellow: "#f3f99d",
    yellowBright: "#ffd751",

    blue: "#57c7ff",
    blueBright: "#2a9bff",

    magenta: "#ff6ac1",
    magentaBright: "#b280f6",

    cyan: "#9aedfe",
    cyanBright: "#0ff",

    white: "#f1f1f0",
    whiteBright: "#fff",
  },
}

const configure = setup("devtool", DEFAULTS)

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

const bc = inView && !inOpaqueOrigin && new BroadcastChannel("devtool")

const setColors = (...options) => {
  colors = {}
  if (bc) {
    const computedStyle = globalThis.top.getComputedStyle(
      globalThis.top.document.documentElement
    )

    for (const [key, value] of Object.entries(DEFAULTS.colors)) {
      // get ansi css variables if defined
      const cssValue = computedStyle.getPropertyValue(`--ansi-${key}`)
      colors[key] = cssValue ? cssValue.trim() : value
    }

    Object.assign(colors, ...options)
    bc.postMessage({ colors })
  } else Object.assign(colors, DEFAULTS.colors, ...options)
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

if (bc && inWorker) {
  bc.onmessage = ({ data }) => {
    if (data.colors) {
      devtool.configure({ colors: data.colors })
    }
  }

  bc.postMessage("devtool-worker:active")
} else if (bc && inView) {
  bc.onmessage = ({ data }) => {
    if (data === "devtool-worker:active") bc.postMessage({ colors })
  }
}

devtool.configure = (options) => {
  devtool.config = configure(options)
  setColors(options?.colors)
  setStates()
}

devtool.configure()

// toggleable(devtool)
devtool.isDevtool = true
devtool.isAnsi = false

export default devtool
