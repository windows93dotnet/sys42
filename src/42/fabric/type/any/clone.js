/* eslint-disable complexity */

// @benchmark https://github.com/davidmarkclements/rfdc

export const DEFAULTS = Object.freeze({
  deep: true,
})

const VALUE_OF = new Set([Boolean, Date, Number, RegExp, String])

const ARRAYS = new Set([
  Array,
  BigInt64Array,
  BigUint64Array,
  Float32Array,
  Float64Array,
  Int16Array,
  Int32Array,
  Int8Array,
  Uint16Array,
  Uint32Array,
  Uint8Array,
  Uint8ClampedArray,
])

function walk(
  source,
  deep = true,
  visitedRefs = new WeakMap(),
  parentTarget = {},
) {
  const type = typeof source

  if (
    (type !== "object" && type !== "function") ||
    source === null ||
    (globalThis.Window && source instanceof Window)
  ) {
    return source
  }

  if (visitedRefs.has(source)) return visitedRefs.get(source)

  let isSet = false
  let isMap = false

  let target

  if (source instanceof Promise) {
    return deep
      ? source.then((result) => walk(result, deep, visitedRefs, target))
      : source.then()
  }

  const realConstructor = !Object.hasOwn(source, "constructor")

  if (type === "function") {
    const fnBody = source.toString()
    const fnName = source.name
    target = new Proxy(source.bind(parentTarget), {
      get(target, prop, receiver) {
        if (prop === "toString") return () => fnBody
        if (prop === "name") return fnName
        return Reflect.get(target, prop, receiver)
      },
    })
  } else if (VALUE_OF.has(source.constructor) && realConstructor) {
    target = new source.constructor(source.valueOf())
  } else if (ARRAYS.has(source.constructor) && realConstructor) {
    target = new source.constructor(source.length)
  } else if (globalThis.File && source instanceof File) {
    target = new File([source], source.name, {
      type: source.type,
      lastModified: source.lastModified,
    })
  } else if (globalThis.Blob && source instanceof Blob) {
    target = new Blob([source], { type: source.type })
  } else if (source instanceof ArrayBuffer) {
    target = new ArrayBuffer(source.byteLength)
    if (deep) new Uint8Array(target).set(new Uint8Array(source))
  } else if (
    globalThis.Node &&
    source.nodeType &&
    typeof source.cloneNode === "function"
  ) {
    target = source.cloneNode(true)
  } else {
    if (source instanceof Set) isSet = true
    if (source instanceof Map) isMap = true
    if (Object.getPrototypeOf(source) === null) target = Object.create(null)
    else {
      try {
        target =
          source.constructor && realConstructor ? new source.constructor() : {}
      } catch (error) {
        target = { $name: source.constructor?.name, $error: error.message }
      }
    }
  }

  if (deep) {
    visitedRefs.set(source, target)

    if (isSet) {
      for (const value of source.values()) {
        target.add(walk(value, deep, visitedRefs, target))
      }
    } else if (isMap) {
      for (const [key, value] of source.entries()) {
        target.set(key, walk(value, deep, visitedRefs, target))
      }
    }

    if (target && typeof target === "object") {
      const sourceDescriptors = Object.getOwnPropertyDescriptors(source)
      const targetDescriptors = Object.getOwnPropertyDescriptors(target)
      for (const [key, descriptor] of Object.entries(sourceDescriptors)) {
        if (targetDescriptors[key]?.configurable === false) {
          if (targetDescriptors[key]?.writable) {
            target[key] = walk(source[key], deep, visitedRefs, target)
          }

          delete sourceDescriptors[key]
        } else if ("value" in descriptor) {
          descriptor.value = walk(descriptor.value, deep, visitedRefs, target)
        } else if ("get" in descriptor) {
          descriptor.value = walk(source[key], deep, visitedRefs, target)
          delete descriptor.get
          delete descriptor.set
        }
      }

      return Object.defineProperties(target, sourceDescriptors)
    }
  }

  return target
}

export default function clone(source, options) {
  const config = { ...DEFAULTS, ...options }
  return walk(source, config.deep)
}

clone.deep = (source) => walk(source, true)
clone.shallow = (source) => walk(source, false)
