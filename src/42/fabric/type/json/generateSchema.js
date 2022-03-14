import groupBy from "../array/groupBy.js"
import { isObject, isIterable, isDate } from "../../is.js"

const TYPES = new Set(["string", "number", "boolean"])

const DEFAULT = {
  strict: false,
}

export default function generateSchema(val, options) {
  const schema = {}
  const config = Object.assign(Object.create(null), DEFAULT, options)

  let type = typeof val
  if (type === "bigint") type = "number"
  if (TYPES.has(type)) {
    schema.type = type
    return schema
  }

  if (val === null || (config.strict === false && val === undefined)) {
    schema.type = "null"
    return schema
  }

  let isArray = Array.isArray(val)
  if (config.strict === false && !isArray && isIterable(val)) {
    isArray = true
    val = [...val]
  }

  if (isArray) {
    schema.type = "array"
    const groups = groupBy(val, (item) => typeof item)
    const values = Object.values(groups)
    if (values.length > 1) {
      schema.items = {
        anyOf: values.map((item) => generateSchema(item[0])),
      }
    } else {
      schema.items = generateSchema(val[0], options)
    }

    return schema
  }

  if (config.strict === false && isDate(val)) {
    schema.type = "string"
    schema.format = "date-time"
    return schema
  }

  if (isObject(val)) {
    schema.type = "object"
    schema.properties = {}
    Object.entries(val).forEach(([key, val]) => {
      schema.properties[key] = generateSchema(val, options)
    })
    return schema
  }

  if (config.strict !== false) {
    throw new TypeError("unexpected data")
  }

  return schema
}
