/* eslint-disable complexity */
import settings from "../../settings.js"
import { addStyle } from "../logUtils.js"
import mark from "../../../fabric/type/any/mark.js"
import truncate from "../../../fabric/type/string/truncate.js"
import freeze from "../../../fabric/type/object/freeze.js"
import { isPlainObject, isArray } from "../../../fabric/type/any/is.js"
import formatFilename from "./formatFilename.js"
// import { encodeJSONPointer } from "../../../type/json/JSONPointerUtils.js"

export const DEFAULTS = freeze({
  ignore: [".", ".."],
  branches: ["└─ ", "├─ ", "   ", "│  "],
  colors: {
    punctuation: "grey",
    subtrees: "blue", // "blue.bold",
    leaves: { base: "cyan" },
    ref: "dim.bright.magenta",
  },
  prefix: "\n{grey .}",
  indent: "",
  ref: true,
  refPath: true,
  colorize: undefined,
  sort: true,
  subtreesFirst: true,
  classify: false,
  stringify: (x) => (typeof x === "string" ? x : truncate(mark(x))),
})

const PRESETS = {
  bash: {
    branches: ["└── ", "├── ", "    ", "│   "],
    prefix: "\n{grey .}",
    colors: {
      subtrees: "blue.bold",
    },
  },
}

const configure = settings("tree", DEFAULTS, PRESETS)

const CLEAN_KEY_REGEX = /^\.[^.]|\n.*?$/g

const isSubtree = (val) => isArray(val) || isPlainObject(val)

const sortLeaves = (a, b) => {
  a = String(a).replace(CLEAN_KEY_REGEX, "")
  b = String(b).replace(CLEAN_KEY_REGEX, "")
  return a.localeCompare(b)
}

const sortSubtreesFirst = (obj) => (a, b) => {
  const aIsSubtree = isSubtree(obj[a])
  const bIsSubtree = isSubtree(obj[b])
  if (aIsSubtree && !bIsSubtree) return -1
  if (!aIsSubtree && bIsSubtree) return 1
  return 0
}

export default function tree(obj, options, stats = {}) {
  if (typeof options === "function") options = { stringify: options }
  const config = configure(options)
  let t = ""

  if (
    (!options || options.classify === undefined) &&
    (!config.colors || !config.colors?.subtrees)
  ) {
    config.classify = true
  }

  const useColors = Boolean(config.colors)
  if (useColors === false) config.colors = {}

  stats.subtrees = 0
  stats.leaves = 0

  const visitedRefs = new WeakMap()

  function walk(obj, indent = "", path = "") {
    if (obj === null) return

    if (obj && typeof obj === "object") {
      if (visitedRefs.has(obj)) {
        if (config.ref) {
          const ref = visitedRefs.get(obj)
          t += addStyle(" [↖", config.colors.ref)

          if (config.refPath) {
            t += " "
            t += useColors
              ? formatFilename(ref, config.colors.leaves, false)
              : ref
            t += " "
          }

          t += addStyle("] ", config.colors.ref)
        }

        return t
      }

      visitedRefs.set(obj, path)
    }

    const keys = isArray(obj) ? [...obj] : Reflect.ownKeys(obj)

    let sort
    if (config.sort && config.subtreesFirst) {
      const dirSort = sortSubtreesFirst(obj)
      sort = (a, b) => {
        const res = dirSort(a, b)
        return res === 0 ? sortLeaves(a, b) : res
      }
    } else if (config.sort) {
      sort = sortLeaves
    } else if (config.subtreesFirst) {
      sort = sortSubtreesFirst(obj)
    }

    if (sort) keys.sort(sort)

    for (let i = 0, l = keys.length; i < l; i++) {
      const key = keys[i]
      const value = obj[key]
      const valIsSubtree = isSubtree(value)
      const stringified = (
        config.stringify(key, { path, value, isSubtree: valIsSubtree }) || key
      ).split("\n")
      const trace = stringified[0]
      const rest = stringified.slice(1)

      if (!config.ignore.includes(key)) {
        const prefix =
          i === keys.length - 1 ? config.branches[0] : config.branches[1]

        const prefixIndent =
          i === keys.length - 1 ? config.branches[2] : config.branches[3]

        if (valIsSubtree) {
          stats.subtrees++

          t += `\n${addStyle(
            indent + prefix,
            config.colors.punctuation,
          )}${addStyle(trace, config.colors.subtrees)}${
            config.classify ? addStyle(".", config.colors.punctuation) : ""
          }`

          walk(value, indent + prefixIndent, `${path}.${trace}`)
        } else {
          stats.leaves++

          t += `\n${addStyle(
            indent + prefix,
            config.colors.punctuation,
          )}${trace}`

          if (rest.length > 0) {
            for (const item of rest) {
              t += `\n${addStyle(
                indent + prefixIndent,
                config.colors.punctuation,
              )}${item}`
            }
          }
        }
      }
    }
  }

  walk(obj, config.indent)

  return `${config.prefix}${t}\n`
}
