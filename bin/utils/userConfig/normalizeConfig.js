import arrify from "../../../src/42/fabric/type/any/arrify.js"
import clone from "../../../src/42/fabric/type/any/clone.js"
import isObject from "../../../src/42/fabric/type/any/is/isObject.js"

const ignoreKeys = new Set(["paths"])

function walk(source, parent, verbose) {
  const target = {}

  if ("verbose" in source) {
    if (source.verbose === undefined) source.verbose = verbose
    else verbose = source.verbose
  }

  if ("glob" in source) {
    target.glob = source.glob ? arrify(source.glob) : arrify(parent.glob)

    if ("ignore" in source) {
      target.ignore =
        "ignore" in parent
          ? [...arrify(parent.ignore), ...arrify(source.ignore)]
          : arrify(source.ignore)
    } else if ("ignore" in parent) {
      target.ignore = arrify(parent.ignore)
    }

    if ("ignore" in target) {
      target.ignore.forEach((item) => {
        if (item.startsWith("!") === false) item = `!${item}`
        if (target.glob?.includes(item) === false) target.glob.push(item)
      })
    }
  }

  Object.keys(source).forEach((key) => {
    if (key in target === false) {
      if (ignoreKeys.has(key)) target[key] = clone(source[key])
      else {
        const value = source[key]
        target[key] = isObject(value)
          ? walk(value, { ...parent, ...target }, verbose)
          : clone(value)
      }
    }
  })

  delete target.ignore

  return target
}

export default function normalizeConfig(source, parent = {}) {
  return walk(source, parent, "verbose" in source ? source.verbose : 1)
}
