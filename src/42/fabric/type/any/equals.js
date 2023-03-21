/* eslint-disable complexity */
/* eslint-disable max-depth */

// @thanks https://github.com/epoberezkin/fast-deep-equal
// @related https://github.com/substack/node-deep-equal

import equalsArrayBufferView from "../../binary/equalsArrayBufferView.js"

const PRIMITIVES = new Set(["boolean", "number", "string"])

const checkNode = "Node" in globalThis
const checkBlob = "Blob" in globalThis

function equalsObject(a, b, config) {
  const keysA = Reflect.ownKeys(a)
  const keysB = Reflect.ownKeys(b)
  const l = keysA.length
  if (l !== keysB.length) return false

  for (let i = 0; i < l; i++) {
    if (Object.hasOwn(b, keysA[i]) === false) return false
  }

  if (config.visited.has(a) && config.visited.has(b)) return true
  config.visited.add(a)
  config.visited.add(b)

  for (let i = 0, l = keysA.length; i < l; i++) {
    if (!walk(a[keysA[i]], b[keysA[i]], config)) {
      return false
    }
  }

  return true
}

function equalsArray(a, b, config) {
  if (a.length !== b.length) return false

  if (config.visited.has(a) && config.visited.has(b)) return true
  config.visited.add(a)
  config.visited.add(b)

  for (let i = 0, l = a.length; i < l; i++) {
    if (!walk(a[i], b[i], config)) return false
  }

  return true
}

function equalsCollection(a, b, config) {
  if (a.size !== b.size) return false
  if (!equalsArray(a.keys(), b.keys(), config)) return false

  if (config.visited.has(a) && config.visited.has(b)) return true
  config.visited.add(a)
  config.visited.add(b)

  const arrA = [...a]
  const arrB = [...b]
  for (let i = 0, l = arrA.length; i < l; i++) {
    if (!walk(arrA[i], arrB[i], config)) return false
  }

  return true
}

function equalsArrayBuffer(a, b) {
  if (a.byteLength !== b.byteLength) return false
  const dataViewA = new Uint8Array(a)
  const dataViewB = new Uint8Array(b)
  for (let i = 0, l = dataViewA.length; i < l; i++) {
    if (dataViewA[i] !== dataViewB[i]) return false
  }

  return true
}

const compareBlob = (a, b) =>
  a.size === b.size &&
  a.type === b.type &&
  a.name === b.name &&
  a.lastModified === b.lastModified &&
  a.webkitRelativePath === b.webkitRelativePath

const deep = (compare, a, b, visited) =>
  compare(a, b, visited) && equalsObject(a, b, visited)

function walk(a, b, config) {
  if (Object.is(a, b)) return true

  let typeA = typeof a
  let typeB = typeof b

  if (typeA !== typeB || PRIMITIVES.has(typeA)) {
    if (config.placeholder && b === config.placeholder) return true
    return false
  }

  if (a && b) {
    const protoA = Object.getPrototypeOf(a)
    const protoB = Object.getPrototypeOf(b)

    if (config.proto && protoA !== protoB) return false
    if (protoA === null) return equalsObject(a, b, config)

    if (typeA === "object") {
      typeA = Array.isArray(a)
      typeB = Array.isArray(b)
      if (typeA && typeB) return deep(equalsArray, a, b, config)
      if (typeA !== typeB) return false

      if (protoA.constructor && protoA.constructor.name !== "Object") {
        typeA = a instanceof Map
        typeB = b instanceof Map
        if (typeA && typeB) return deep(equalsCollection, a, b, config)
        if (typeA !== typeB) return false

        typeA = a instanceof Set
        typeB = b instanceof Set
        if (typeA && typeB) return deep(equalsCollection, a, b, config)
        if (typeA !== typeB) return false

        typeA = a instanceof ArrayBuffer
        typeB = b instanceof ArrayBuffer
        if (typeA && typeB) return equalsArrayBuffer(a, b)
        if (typeA !== typeB) return false

        typeA = ArrayBuffer.isView(a)
        typeB = ArrayBuffer.isView(b)
        if (typeA && typeB) return equalsArrayBufferView(a, b)
        if (typeA !== typeB) return false

        if (checkNode) {
          typeA = a instanceof Node
          typeB = b instanceof Node
          if (typeA && typeB && a.isEqualNode(b) === false) return false
          if (typeA !== typeB) return false
        }

        if (checkBlob) {
          typeA = a instanceof Blob
          typeB = b instanceof Blob
          if (typeA && typeB && compareBlob(a, b) === false) return false
          if (typeA !== typeB) return false
        }

        const toStringA = typeof a.toString === "function"
        const toStringB = typeof b.toString === "function"
        if (toStringA && toStringB && a.toString() !== b.toString()) {
          return false
        }

        if (toStringA !== toStringB) return false
      }

      return equalsObject(a, b, config)
    }

    if (typeA === "function" && a.toString() === b.toString()) {
      return equalsObject(a, b, config)
    }
  }

  return false
}

export default function equals(a, b, options) {
  const config = {}
  config.visited = new WeakSet()
  config.proto = options?.proto ?? true
  config.placeholder = options?.placeholder
  return walk(a, b, config)
}
