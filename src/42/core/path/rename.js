import { normalizeString } from "./core/normalizePath.js"
import parsePath from "./core/parsePath.js"
import formatPath from "./core/formatPath.js"
import parseRegexLiteral from "../../fabric/type/regex/parseRegexLiteral.js"
import arrify from "../../fabric/type/any/arrify.js"
import manipulation from "../../fabric/type/string/manipulation.js"

const makePlaceholder = (i) => `#PLACEHOLDER_${42}_${i}`

const makeFilter = (filter, replacer) => {
  const tokens = filter.slice(1, -1).split("|")
  const list = []

  tokens.forEach((name) => {
    let args
    const colonPos = name.indexOf(":")
    if (colonPos > -1) {
      args = name.slice(colonPos + 1)
      name = name.slice(0, colonPos).trim()
      if (name === "replace") {
        const lastCommaPos = args.lastIndexOf(",")
        let replacer = args.slice(0, lastCommaPos)
        const newSubstr = args.slice(lastCommaPos + 1)
        if (replacer.startsWith("/")) {
          replacer = new RegExp(...parseRegexLiteral(replacer))
        }

        args = [replacer, newSubstr]
      } else args = args.split(",")
    } else name = name.trim()
    if (name in manipulation) list.push([manipulation[name], args ?? []])
  })

  if (list.length > 0) {
    return (...args) => {
      let res = replacer(...args)
      if (Array.isArray(res)) {
        res = res.map((x) => {
          list.forEach(([fn, args]) => {
            x = fn(x, ...args)
          })
          return x
        })
      } else {
        list.forEach(([fn, args]) => {
          res = fn(res, ...args)
        })
      }

      return res
    }
  }

  return (key, glob) => {
    const res = replacer(key, glob)
    return Array.isArray(res) ? [...res, filter] : res + filter
  }
}

const makeReplacer = (key, glob) => {
  if (key === "dir") {
    if (glob === "*") {
      return (str, before) => [...before, str.shift()]
    }

    if (glob === "**") {
      return (str, before) => [...before, ...str]
    }

    if (glob.startsWith("#")) {
      return (str, before, i) => [
        ...before,
        String(i + 1).padStart(glob.length, "0"),
      ]
    }
  }

  if (glob.startsWith("#")) {
    return (str, i) => String(i + 1).padStart(glob.length, "0")
  }

  return (str) => str
}

const makeFragments = (fragments, str, i, isDir) => {
  if (isDir) {
    const strParts = str.split("/")
    let out = []
    fragments.forEach((x) => {
      if (typeof x === "function") out = x(strParts, out, i)
      else out.push(...x.split("/"))
    })
    return normalizeString(out.join("/"))
  }

  return fragments
    .map((x) => (typeof x === "function" ? x(str, i) : x))
    .join("")
}

const makePattern = (pattern) => {
  // Expand global pattern
  if (pattern.startsWith("{") && pattern.endsWith("}")) {
    pattern = `**${pattern}/*${pattern}.*${pattern}`
  }

  const rules = []
  const fragments = { dir: [], name: [], ext: [] }
  const fragmentsKeys = Object.keys(fragments)

  // Replace special characters with placeholders
  pattern = pattern.replaceAll(
    /(\\)?(\?+|#+|\*{1,2})({[^}]+})?/g,
    (_, escaped, glob, filter) => {
      let out = ""
      if (escaped && glob.startsWith("#")) {
        out = "#"
        glob = glob.slice(1)
        if (glob.length > 0) escaped = false
      }

      return `${out}${
        escaped
          ? (glob ?? "") + (filter ?? "")
          : makePlaceholder(rules.push([glob, filter]) - 1)
      }`
    },
  )

  const parsedPattern = parsePath(pattern)

  fragmentsKeys.forEach((key) => {
    rules.forEach(([glob, filter], i) => {
      const placeholder = makePlaceholder(i)
      const indexOf = parsedPattern[key].indexOf(placeholder)
      if (indexOf > -1) {
        if (indexOf > 0) {
          fragments[key].push(parsedPattern[key].slice(0, indexOf))
        }

        let replacer = makeReplacer(key, glob)
        if (filter) replacer = makeFilter(filter, replacer)
        fragments[key].push(replacer)

        parsedPattern[key] = parsedPattern[key].slice(
          indexOf + placeholder.length,
        )
      }
    })
  })

  fragmentsKeys.forEach((key) => {
    if (parsedPattern[key]) {
      fragments[key].push(parsedPattern[key])
    }
  })

  return (path, i) => {
    let { dir, name, ext } = parsePath(path)

    if (dir !== parsedPattern.dir) {
      dir = makeFragments(fragments.dir, dir, i, true)
    }

    if (name !== parsedPattern.name) {
      name = makeFragments(fragments.name, name, i)
    }

    if (ext !== parsedPattern.ext) {
      ext = makeFragments(fragments.ext, ext.slice(1), i)
    }

    return formatPath({ name, dir, ext })
  }
}

export default function rename(paths, pattern) {
  return arrify(paths).map(makePattern(pattern))
}
