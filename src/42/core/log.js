// @related https://github.com/xpl/ololog

import system from "../system.js"
import stackTrace from "../fabric/type/error/stackTrace.js"
import Logger from "./console/Logger.js"
import formatFilename from "./console/formatters/formatFilename.js"
import formatEntries from "./console/formatters/formatEntries.js"
import formatError from "./console/formatters/formatError.js"
import highlight from "./console/formatters/highlight.js"
import tree from "./console/formatters/tree.js"
import stringify from "../fabric/type/any/stringify.js"
import { esc, escapeLog, unescapeLog } from "./console/logUtils.js"

export {
  esc,
  escapeLog,
  unescapeLog,
  addStyle,
  removeStyles,
} from "./console/logUtils.js"

export { CONSOLE_KEYS } from "./console/Logger.js"

const stringifyPresetsKeys = Object.keys(system.configs.stringify.presets)

system.configs.formatEntries.presets.javascript.valueFormater = (value) =>
  highlight(stringify.line.limit(value))

export const format = Object.assign(
  (data, options) => highlight(stringify(data, options)),
  {
    file: formatFilename,
    entries: formatEntries,
    error: formatError,
    hr(char = "┄", color = "grey") {
      const col = globalThis?.process?.stdout?.columns ?? 10
      return `{${color} ${char.repeat(col)}}`
    },
    highlight,
    tree,
  },
)

export class Log extends Logger {
  constructor(options = {}) {
    if (typeof options === "number") options = { verbose: options }

    super(
      {
        formater(args, data) {
          if (data.hour) {
            const hour = new Date().toLocaleTimeString("en-US", {
              hour12: false,
            })
            data.prefix = `{grey ${hour}} ${data.prefix}`
          }

          if (data.tree) {
            data.joiner = "\n"
            return args.map((x) => tree(x, data.config?.tree))
          }

          if (data.entries) {
            data.joiner = "\n"
            return args.map((x) => formatEntries(x, data.config?.entries))
          }

          if (data.file) {
            data.joiner = "\n"
            return args.map((x) => formatFilename(x, data.config?.file))
          }

          if (data.highlight) {
            data.joiner = "\n"
            return args.map((x) => highlight(x, data.config?.highlight))
          }

          for (const key of Object.keys(data)) {
            if (data[key] && stringifyPresetsKeys.includes(key)) {
              data.config ??= Object.create(null)
              data.config.stringify ??= Object.create(null)

              if (typeof data.config.stringify === "string") {
                // data.config.stringify = system.configs.stringify.presets[key]
                data.config.stringify = Object.create(null)
              }

              Object.assign(
                data.config.stringify,
                system.configs.stringify.presets[key],
              )
            }
          }

          if (data.async) {
            return Promise.all(
              args.map(async (x) => {
                if (x instanceof Error) {
                  return formatError(x, data.config?.error)
                }

                return typeof x === "string"
                  ? x
                  : highlight(
                      await stringify(x, data.config?.stringify ?? "clean"),
                      data.config?.highlight,
                    )
              }),
            )
          }

          return args.map((x) => {
            if (x instanceof Error) return formatError(x, data.config?.error)
            return typeof x === "string"
              ? x
              : highlight(
                  stringify(x, data.config?.stringify ?? "clean"),
                  data.config?.highlight,
                )
          })
        },
        chain: [
          stringifyPresetsKeys,
          {
            origin: false,
            entries: false,
            file: false,
            tree: false,
            highlight: false,
            hour: false,
            if({ data }, condition) {
              data.paused = !condition
            },
            hr({ call, entries }, char, color) {
              entries.length = 0
              call(format.hr(char, color))
            },
            br({ call, entries }) {
              entries.length = 0
              call("")
            },
            p({ call, entries }, ...args) {
              entries.push(["joiner", "\n"])
              call(...args)
            },
          },
        ],
        ...options,
      },

      (data) => {
        if (data.origin) {
          const stack = stackTrace().pop()
          if (stack) {
            data.prefix = `${formatFilename(stack, data.config?.file)}\n${
              data.prefix
            }`
          }
        }
      },
    )

    this.verbose = options.verbose ?? 1
    this.format = format

    this.esc = esc
    this.escape = escapeLog
    this.unescape = unescapeLog
    // this.addStyle = addStyle
    // this.removeStyles = removeStyles
  }
}

export const log = new Log()

export default log
