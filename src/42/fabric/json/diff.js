/* eslint-disable max-params */
/* eslint-disable complexity */

//! Copyright (c) 2017 Greg Sexton. Apache License, Version 2.0.
// @src https://github.com/gregsexton/json-patch-gen

import equals from "../type/any/equals.js"
import joinJSONPointer from "./joinJSONPointer.js"
import isHashmapLike from "../type/any/is/isHashmapLike.js"

import LinkedListNode from "../structure/LinkedListNode.js"

const checkIsJsonValue = function (value) {
  switch (typeof value) {
    case "string":
    case "boolean":
    case "number":
    case "object":
      return value
    default:
      throw new Error(value.toString() + " is not a valid JSON value")
  }
}

const init = function (length) {
  const table = Array.from({ length })
  for (let i = 0; i < length; ++i) {
    table[i] = Array.from({ length })
    table[0][i] = { cost: i, op: i > 0 ? "i" : undefined }
    table[i][0] = { cost: i, op: i > 0 ? "d" : undefined }
  }

  return table
}

function makeArrayDiff(a, b, table) {
  let arr1val
  let arr2val
  let match
  let ins
  let del
  let cost
  let eql
  for (let i = 1; i <= a.length; ++i) {
    for (let j = 1; j <= b.length; ++j) {
      arr1val = a[i - 1]
      arr2val = b[j - 1]
      eql = Object.is(arr1val, arr2val)
      match = table[i - 1][j - 1].cost + (eql ? 0 : 1)
      ins = table[i][j - 1].cost + 1
      del = table[i - 1][j].cost + 1
      cost = Math.min(match, ins, del)
      table[i][j] = {}
      table[i][j].cost = cost
      table[i][j].op =
        cost === match ? (eql ? "m" : "r") : cost === ins ? "i" : "d"
    }
  }

  return table
}

export function LCS(a, b) {
  const m = a.length
  const n = b.length
  const C = []
  let i
  let j
  for (i = 0; i <= m; i++) C.push([0])
  for (j = 0; j < n; j++) C[0].push(0)
  for (i = 0; i < m; i++) {
    for (j = 0; j < n; j++) {
      C[i + 1][j + 1] =
        a[i] === b[j] ? C[i][j] + 1 : Math.max(C[i + 1][j], C[i][j + 1])
    }
  }

  return (function bt(i, j) {
    if (i * j === 0) {
      return ""
    }

    if (a[i - 1] === b[j - 1]) {
      return bt(i - 1, j - 1) + a[i - 1]
    }

    return C[i][j - 1] > C[i - 1][j] ? bt(i, j - 1) : bt(i - 1, j)
  })(m, n)
}

// TODO: look at Hirschberg's algorithm to do better than O(n^2) space
// @read https://stackoverflow.com/a/46706447
export const arrayDiff = function (a, b, options, path = [], parents = {}) {
  parents.a = new LinkedListNode(a, parents.a)
  parents.b = new LinkedListNode(b, parents.b)

  const len = Math.max(a.length, b.length) + 1

  const constructPath = function (table) {
    let i = a.length
    let j = b.length
    let entry = table[i][j]

    const acc = []

    while (entry.op !== undefined) {
      if (entry.op === "i") {
        acc.push({
          op: "add",
          path: joinJSONPointer(path.concat(String(i))),
          value: b[--j],
        })
      } else if (entry.op === "d") {
        acc.push({
          op: "remove",
          path: joinJSONPointer(path.concat(String(--i))),
        })
      } else if (entry.op === "r") {
        acc.push({
          op: "replace",
          path: path.concat(String(--i)),
          value: b[--j],
        })
      } else if (entry.op === "m") {
        i--
        j--
      } else {
        throw new Error("Unknown op: " + entry.op)
      }

      entry = table[i][j]
    }

    return acc
  }

  const deepDiff = function (patches) {
    let idx
    let patch
    let patchIdx

    for (idx in patches) {
      if (Object.hasOwn(patches, idx)) {
        patch = patches[idx]
        if (patch.op === "replace") {
          patchIdx = patch.path[patch.path.length - 1]
          patches[idx] = valueDiff(
            a[patchIdx],
            patch.value,
            patch.path,
            options,
            parents
          )
        }
      }
    }

    return patches
  }

  return deepDiff(constructPath(makeArrayDiff(a, b, init(len)))).flat()
}

function replaceWithB(path, b) {
  return [{ op: "replace", path: joinJSONPointer(path), value: b }]
}

function valueDiff(a, b, path, options, parents = {}) {
  if (Object.is(a, b)) return []

  let typeA = typeof a
  let typeB = typeof b
  if (typeA !== typeB) return replaceWithB(path, b)

  // if (typeA === "string" && typeB === "string") {
  //   return arrayDiff(a, b, path, options, parents)
  // }

  if (typeA === "object") {
    const circularA = parents.a && parents.a.indexOfNext(a)
    const circularB = parents.b && parents.b.indexOfNext(b)
    if (circularA !== circularB) return replaceWithB(path, b)
    if (circularA > -1) return []
    parents.a = new LinkedListNode(a, parents.a)
    parents.b = new LinkedListNode(b, parents.b)

    typeA = Array.isArray(a)
    typeB = Array.isArray(b)

    if (typeA && typeB) return arrayDiff(a, b, options, path, parents)
    if (typeA !== typeB) return replaceWithB(path, b)

    // typeA = isIterable(a)
    // typeB = isIterable(b)
    typeA = a instanceof Map
    typeB = b instanceof Map

    if (typeA && typeB) {
      return valueDiff(
        Object.fromEntries(a.entries()),
        Object.fromEntries(b.entries()),
        path,
        options,
        parents
      )
    }

    if (typeA !== typeB) return replaceWithB(path, b)

    typeA = a instanceof Set
    typeB = b instanceof Set

    if (typeA && typeB) {
      return arrayDiff([...a], [...b], options, path, parents)
    }

    if (typeA !== typeB) return replaceWithB(path, b)
  }

  if (isHashmapLike(a) === false || isHashmapLike(b) === false) {
    return equals(a, b) ? [] : replaceWithB(path, b)
  }

  let acc = []
  for (const key in b) {
    if (Object.hasOwn(b, key)) {
      if (key in a) {
        acc = acc.concat(
          valueDiff(a[key], b[key], path.concat(key), options, parents)
        )
      } else {
        acc.push({
          op: "add",
          path: joinJSONPointer(path.concat(key)),
          value: options?.strict ? checkIsJsonValue(b[key]) : b[key],
        })
      }
    } else if (options?.strict) {
      throw new Error(b.toString() + " has a prototype")
    }
  }

  for (const key in a) {
    if (Object.hasOwn(a, key)) {
      if (!(key in b)) {
        acc.push({ op: "remove", path: joinJSONPointer(path.concat(key)) })
      }
    } else if (options?.strict) {
      throw new Error(a.toString() + " has a prototype")
    }
  }

  return acc
}

export default function diff(a, b, options = {}) {
  return valueDiff(a, b, [], options)
}
