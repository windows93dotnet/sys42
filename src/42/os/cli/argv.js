/* eslint-disable complexity */
import allocate from "../../fabric/locator/allocate.js"
import setup from "../../system/setup.js"
import locate from "../../fabric/locator/locate.js"
import { isObject, isArray } from "../../fabric/type/any/is.js"

export const _undefined = Symbol("argv.undefined")

// TODO: combine with validator
const types = Object.freeze({
  null: (val) => val === null,
  boolean: (val) => typeof val === "boolean",
  string: (val) => typeof val === "string",
  number: (val) => Number.isFinite(val),
  integer: (val) => Number.isInteger(val),
  array: (val) => Array.isArray(val),
  object: (val) =>
    val !== null && typeof val === "object" && !Array.isArray(val),
})

export const DEFAULTS = {
  argsKey: "_",
  emptyArgs: false,
  negateToBoolean: true,
  splitSmallOption: true,
  autoBoolean: true,
  autocast: true,
  jsonParse: JSON.parse,
  aliases: {},
  presets: {},
  schema: {},
  count: [],
  globalOptions: [],
  typesDefaults: {
    array: [],
    boolean: true,
    integer: 0,
    null: null,
    number: 0,
    object: {},
    string: "",
  },
}

export const PRESETS = {
  verbose: {
    schema: { verbose: { type: "number" } },
    count: ["verbose"],
    globalOptions: ["silent"],
    aliases: { v: "verbose", s: "silent" },
    presets: { silent: { verbose: 0 } },
  },
}

const configure = setup("argv", DEFAULTS, PRESETS)

function autocast(config, val) {
  if (config.autocast) {
    if (val === "undefined") return

    try {
      return config.jsonParse(val)
    } catch {}
  }

  return val
}

function getFollowingArguments(arg, config, args, i) {
  const schemaType = config.schema?.[arg]?.type

  const index = i

  let value = []

  while (
    args[i + 1] &&
    args[i + 1].startsWith("-") === false &&
    config.subcommands.includes(args[i + 1]) === false
  ) {
    value.push(autocast(config, args[++i]))
  }

  if (value.length === 0) value = _undefined
  else if (value.length === 1) value = value[0]

  if (schemaType && !types[schemaType](value)) {
    return { value: _undefined, i: index }
  }

  return { value, i }
}

/**
 * Command line argument parsing
 * @param {array<string>} args
 * @param {object} options
 * @returns {object}
 */
export default function argv(args, options) {
  const config = configure(options)

  const {
    aliases,
    count,
    argsKey,
    emptyArgs,
    negateToBoolean,
    presets,
    schema,
    splitSmallOption,
    typesDefaults,
  } = config

  const subcommands = []
  const cmdHashMap = {}
  if (isObject(config.subcommands)) {
    for (const [key, val] of Object.entries(config.subcommands)) {
      for (const item of val) {
        cmdHashMap[item] = !key || key === "." ? item : `${key}.${item}`
      }

      subcommands.push(...val)
    }
  } else if (isArray(config.subcommands)) {
    subcommands.push(...config.subcommands)
  }

  config.subcommands = subcommands

  const out = {}
  let obj = out
  if (emptyArgs) obj[argsKey] = []

  function addOption(obj, key, value) {
    if (config.globalOptions.includes(key)) obj = out

    if (key in presets) {
      Object.assign(obj, presets[key])
      return
    }

    if (count.includes(key) && value === _undefined) {
      const previous = locate(obj, key)
      value = previous === undefined ? 1 : previous + 1
    }

    if (key in schema && value === _undefined) {
      if (schema[key].default) {
        value = schema[key].default
      } else if (
        typesDefaults &&
        typeof typesDefaults === "object" &&
        schema[key].type &&
        schema[key].type in typesDefaults
      ) {
        value = typesDefaults[schema[key].type]
      }
    }

    if (config.autoBoolean && value === _undefined) value = true

    if (value === _undefined) value = undefined

    allocate(obj, key, value)
  }

  const addInput = emptyArgs
    ? (arg) => obj[argsKey].push(autocast(config, arg))
    : (arg) => {
        if (argsKey in obj === false) obj[argsKey] = []
        obj[argsKey].push(autocast(config, arg))
      }

  for (let i = 0, l = args.length; i < l; i++) {
    let arg = String(args[i])

    if (arg === "--" && args[i + 1]) {
      while (args[i + 1]) addInput(args[++i])
    } else if (subcommands.includes(arg)) {
      if (arg in cmdHashMap) {
        obj =
          locate(out, cmdHashMap[arg]) || (emptyArgs ? { [argsKey]: [] } : {})
        allocate(out, cmdHashMap[arg], obj)
      } else {
        obj = emptyArgs ? { [argsKey]: [] } : {}
        out[arg] = obj
      }
    } else if (arg.startsWith("--")) {
      arg = arg.slice(2)
      if (arg in aliases) arg = aliases[arg]

      const eq = arg.indexOf("=")
      if (eq === -1) {
        let value
        if (negateToBoolean && arg.startsWith("no-")) {
          value = false
          arg = arg.slice(3)
        } else {
          const rest = getFollowingArguments(arg, config, args, i)
          i = rest.i
          value = rest.value
        }

        addOption(obj, arg, value)
      } else {
        addOption(obj, arg.slice(0, eq), autocast(config, arg.slice(eq + 1)))
      }
    } else if (arg.startsWith("-")) {
      arg = arg.slice(1)

      let rest

      if (splitSmallOption && arg.includes(".") === false) {
        for (let item of arg.split("")) {
          if (item in aliases) item = aliases[item]
          rest = getFollowingArguments(item, config, args, i)
          addOption(obj, item, rest.value)
        }

        i = rest.i
      } else {
        if (arg in aliases) arg = aliases[arg]
        rest = getFollowingArguments(arg, config, args, i)
        i = rest.i
        addOption(obj, arg, rest.value)
      }
    } else addInput(arg)
  }

  return out
}
