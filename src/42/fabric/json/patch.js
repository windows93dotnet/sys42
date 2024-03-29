/* eslint-disable max-params */

// JavaScript Object Notation (JSON) Patch
// @implement https://tools.ietf.org/html/rfc6902

import locate from "../locator/locate.js"
import exists from "../locator/exists.js"
import arrify from "../type/any/arrify.js"
import equals from "../type/any/equals.js"
import splitJSONPointer from "./splitJSONPointer.js"

function splice(str, index, count, add = "") {
  // We cannot pass negative indexes directly to the 2nd slicing operation.
  if (index < 0) {
    index = str.length + index
    if (index < 0) index = 0
  }

  return str.slice(0, index) + add + str.slice(index + count)
}

function op(
  obj,
  segments,
  options,
  objectOp,
  arrayOp,
  stringOp,
  raise,
  remove,
) {
  let track = ""
  let raised = false
  let previousValue = obj
  let previousKey
  let acc = obj

  segments.forEach((key, i, arr) => {
    track += `/${key}`

    if (arr.length - 1 === i) {
      const type = typeof acc
      if (type === "string" || Array.isArray(acc)) {
        key = key === "-" ? acc.length - (remove ? 1 : 0) : key
        const index = Number(key)
        if (options?.strict) {
          if (Number.isNaN(index)) {
            throw new RangeError(
              `path "${track}" is not allowed on array target`,
            )
          }

          if (String(index) !== String(key)) {
            throw new RangeError(`invalid array index: ${key} ${String(index)}`)
          }

          if (index < 0 || index > acc.length) {
            throw new RangeError(`path "${track}" is out of bounds`)
          }
        }

        if (raise && acc[index] === undefined) raised = track
        return type === "string"
          ? stringOp(acc, index, previousValue, previousKey)
          : arrayOp(acc, index)
      }

      if (raise && key in acc === false) raised = track
      return objectOp(acc, key)
    }

    previousValue = acc
    previousKey = key

    acc = acc[key]
  })

  if (raised) throw new RangeError(`path "${track}" does not exist`)
}

export function add(obj, path, val, options) {
  let out = obj
  const segments = splitJSONPointer(path)
  if (segments.length === 0) out = val
  else {
    op(
      out,
      segments,
      options,
      (out, key) => (out[key] = val),
      (arr, index) => arr.splice(index, 0, val),
      (str, index, previousValue, previousKey) => {
        const res = splice(str, index, 0, val)
        if (previousKey) previousValue[previousKey] = res
        else out = res
        return res
      },
    )
  }

  return out
}

export function remove(obj, path, val = 1, options) {
  let out = obj
  const segments = typeof path === "string" ? splitJSONPointer(path) : path
  if (segments.length === 0) out = undefined
  else {
    let raise
    op(
      out,
      segments,
      options,
      (out, key) => delete out[key],
      (arr, index) => arr.splice(index, 1),
      (str, index, previousValue, previousKey) => {
        const res = splice(
          str,
          index,
          typeof val === "number" ? val : val.length,
        )
        if (previousKey) previousValue[previousKey] = res
        else out = res
        return res
      },
      true,
      true,
    )
    if (raise && options?.strict) {
      throw new RangeError(`path "${path}" does not exist`)
    }
  }

  return out
}

export function copy(obj, from, path, options) {
  const segments = splitJSONPointer(from)
  if (
    options?.strict &&
    (segments.length === 0 || exists.run(obj, segments) === false)
  ) {
    throw new RangeError(`path "${from}" does not exist`)
  }

  let value
  op(
    obj,
    segments,
    options,
    (obj, key) => (value = obj[key]),
    (arr, index) => (value = arr[index]),
    (str, index) => (value = str[index]),
    true,
  )
  add(obj, path, value)
  return obj
}

export function move(obj, from, path, options) {
  const segments = splitJSONPointer(from)
  if (
    options?.strict &&
    (segments.length === 0 || exists.run(obj, segments) === false)
  ) {
    throw new RangeError(`path "${from}" does not exist`)
  }

  const value = locate.run(obj, segments)
  remove(obj, segments, options)
  add(obj, path, value, options)
  return obj
}

export function replace(obj, path, val, options) {
  let out = obj
  const segments = splitJSONPointer(path)
  if (segments.length === 0) out = val
  else {
    op(
      out,
      segments,
      options,
      (obj, key) => (obj[key] = val),
      (arr, index) => (arr[index] = val),
      (str, index, previousValue, previousKey) => {
        const res = splice(str, index, val.length, val)
        if (previousKey) previousValue[previousKey] = res
        else out = res
        return res
      },
    )
  }

  return out
}

export function test(obj, path, expected) {
  const actual = locate.run(obj, splitJSONPointer(path))

  if (equals(actual, expected) === false) {
    throw Object.assign(
      new Error(`patch test failed: value at ${path} is not like expected`),
      { actual, expected },
    )
  }
}

export default function patch(obj, patches, options) {
  patches = arrify(patches)

  let out = obj

  for (const patch of patches) {
    let { op, path, from, value } = patch

    if (options?.strict) {
      if ((op === "add" || op === "replace") && "value" in patch === false) {
        throw new Error(`missing 'value' parameter`)
      }

      if (path !== "" && path.startsWith("/") === false) {
        throw new Error(`JSON Pointer should start with a slash`)
      }
    } else if (path === undefined && Array.isArray(obj)) {
      path = "-"
    }

    // prettier-ignore
    switch (op) {
      case "add": out = add(out, path, value, options); break
      case "move": out = move(out, from, path, options); break
      case "copy": out = copy(out, from, path, options); break
      case "remove": out = remove(out, path, value, options); break
      case "replace": out = replace(out, path, value, options); break
      case "test": test(out, path, value, options); break
      default: if (options?.strict) throw new Error(`unrecognized op: ${op}`)
    }
  }

  return out
}

patch.add = add
patch.move = move
patch.copy = copy
patch.remove = remove
patch.replace = replace
patch.test = test
