import Callable from "../../fabric/class/Callable.js"
import chainable from "../../fabric/traits/chainable.js"
// import toggleable from "../../fabric/traits/toggleable.js"
import configure from "../configure.js"
import noop from "../../fabric/type/function/noop.js"
import parseLogTemplate from "./parseLogTemplate.js"
import { unescapeLog } from "./logUtils.js"
import inBackend from "../env/runtime/inBackend.js"
import inAutomated from "../env/runtime/inAutomated.js"

const inBackendOrAutomated = inBackend || inAutomated

const stylizer = await import(
  `./stylizers/${inBackendOrAutomated ? "ansi" : "devtool"}.js`
).then((m) => m.default)

const formater = (args) =>
  args.map((x) => {
    if (x && typeof x === "object") {
      if (x instanceof Error) return x.stack

      try {
        return JSON.stringify(x, false, 2)
      } catch {
        return toString.call(x)
      }
    }

    return x
  })

const DEFAULTS = {
  joiner: " ",
  formater,
  chain: [],
  context: {},
}

const STYLABLES = new Set([
  "debug",
  "error",
  "group",
  "groupCollapsed",
  "info",
  "log",
  "trace",
  "warn",
])

const CONSOLE_IGNORE = new Set(["Console", "context"])
export const CONSOLE_KEYS = Object.keys(console)
  .filter(
    (key) => !CONSOLE_IGNORE.has(key) && typeof console[key] === "function"
  )
  .sort()

const GETTERS = stylizer[Symbol.for("chainable.GETTERS")]

// [1] normalize node, firefox and chrome console output on empty string

export default class Logger extends Callable {
  constructor(options, contextHandler = noop) {
    const config = configure(DEFAULTS, options)

    const make =
      (key) =>
      ({ entries, data }, ...args) => {
        if (
          this.enabled === false ||
          data.paused === true ||
          data.level > this.verbose
        ) {
          return this
        }

        if (!STYLABLES.has(key)) {
          this.console[key](...args)
          return this
        }

        let logError
        if (
          this.stylizer.isDevtool &&
          key === "log" &&
          args.length === 1 &&
          args[0] instanceof Error
        ) {
          logError = args[0]
          key = "groupCollapsed"
          // this.console.log(" ")
        }

        contextHandler(data, this)
        args = config.formater(args, data, this)

        const res = data.prefix + args.join(data.joiner) + data.suffix

        if (res === "") {
          this.console[key](" ") // [1]
          return this
        }

        let out = ""
        if (this.stylizer.isAnsi) {
          this.stylize(entries, res, (str) => {
            out += str
          })
          this.console[key](unescapeLog(out))
        } else {
          const css = []
          this.stylize(entries, res, ([str, style]) => {
            out += str
            css.push(style)
          })
          this.console[key](unescapeLog(out + " " /* [1] */), ...css)
        }

        if (logError) {
          this.console.log(logError.stack)
          this.console.groupEnd()
        }

        // return "this" to reset chain's context after a log call
        // allowing things like log.red.group("red").log("not red").groupEnd()
        return this
      }

    super(
      chainable(
        {
          joiner: config.joiner,
          paused: false,
          level: 1,
          prefix: "",
          suffix: "",
          ...config.context,
        },
        {
          color({ entries }, value) {
            entries.push(["color", value])
          },
          configure({ data }, options) {
            data.config = options
          },
          joiner({ data }, value) {
            data.joiner = value
          },
          prefix({ data }, value) {
            data.prefix += String(value)
          },
          suffix({ data }, value) {
            data.suffix += String(value)
          },
          level({ data }, value) {
            value = Number(value)
            if (Number.isNaN(value)) {
              throw new TypeError("level value must be a valid number")
            } else data.level = value
          },
        },
        Object.fromEntries(CONSOLE_KEYS.map((key) => [key, make(key)])),
        GETTERS,
        ...config.chain,
        // To allow "log`message`" to be equivalent to "log.log`message`"
        // "this" is a "chainable" function based on the "log" method
        // The trick is that the "make" function is an arrow function
        // that can access "this"
        make("log")
      ),
      "log"
    )

    this.stylizer = stylizer
    this.console = globalThis.console
    // toggleable(this)
  }

  getMainStyles(entries) {
    const styles = []

    for (const [key, val] of entries) {
      if (GETTERS.includes(key)) styles.push(key)
      else if (key === "color") styles.push(val)
      else if (key === "bgColor") styles.push("bg", val)
    }

    return styles
  }

  getStyleChain(styles, buffer) {
    let chain = this.stylizer
    if (buffer) styles = [...styles, ...buffer.split(".")]

    for (const style of styles) {
      if (style === "reset") chain = this.stylizer
      else chain = GETTERS.includes(style) ? chain[style] : chain.color(style)
    }

    return { styles, chain }
  }

  stylize(entries, res, add) {
    const tokens = parseLogTemplate(res)
    const state = { 0: this.getStyleChain(this.getMainStyles(entries)) }

    for (const { type, buffer, nested } of tokens) {
      if (type === "text") add(state[nested].chain(buffer))
      else state[nested] = this.getStyleChain(state[nested - 1].styles, buffer)
    }
  }
}
