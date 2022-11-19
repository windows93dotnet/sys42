import configure from "../../configure.js"
import arrify from "../../../fabric/type/any/arrify.js"
import locate from "../../../fabric/locator/locate.js"
import allocate from "../../../fabric/locator/allocate.js"
import parseINI from "./parseINI.js"

const DEFAULT = {
  parseValue: JSON.parse,
  delimiter: [".", "\\"],
  hashmap: true,
  formatKey: false,
  formatSection: false,
}

export function decodeINI(str, options) {
  const config = configure(DEFAULT, options)
  const { parseValue } = config
  const out = Object.create(null)

  const { hashmap } = config
  const sectionOptions = { hashmap, delimiter: config.delimiter }
  const keyOptions = { hashmap, delimiter: "" }
  const delimiters = arrify(config.delimiter)

  let key
  let array
  let current = out

  for (const { type, buffer } of parseINI(str, delimiters)) {
    if (key || array) {
      if (type === "value") {
        let val
        try {
          val = parseValue(buffer)
        } catch {
          val = buffer
        }

        if (array) array.push(val)
        else {
          allocate(current, key, val, keyOptions)
          key = undefined
        }

        continue
      } else if (key) {
        allocate(current, key, true, keyOptions)
      }
    }

    if (type === "key") {
      if (array) array = undefined
      key = config.formatKey ? config.formatKey(buffer) : buffer
      continue
    }

    if (type === "section") {
      const sectionName = config.formatSection
        ? config.formatSection(buffer)
        : buffer
      current = locate(out, sectionName, delimiters) ?? Object.create(null)
      allocate(out, sectionName, current, sectionOptions)
      continue
    }

    if (type === "array") {
      array = locate(current, buffer, delimiters) ?? []
      if (!Array.isArray(array)) array = [array]
      allocate(current, buffer, array, keyOptions)
      continue
    }
  }

  if (key) {
    allocate(current, key, true, keyOptions)
  }

  return out
}

export default decodeINI
