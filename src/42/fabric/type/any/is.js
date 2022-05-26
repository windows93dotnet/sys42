/* eslint-disable eqeqeq */
// @thanks https://github.com/jonschlinkert/is-plain-object
// @thanks https://stackoverflow.com/a/32538867
// @thanks https://github.com/lodash/lodash/blob/master/isLength.js
// @related https://github.com/chaijs/type-detect/blob/master/index.js

// import detectCircular from "./object/detectCircular.js"
import isEmptyObject from "./is/isEmptyObject.js"
import isLength from "./is/isLength.js"

// TODO: move more usefull is* functions in 'any' folder
export { default as isEmptyObject } from "./is/isEmptyObject.js"
export { default as isLength } from "./is/isLength.js"
export { default as isProxy } from "./is/isProxy.js"
export { default as isArrayLike } from "./is/isArrayLike.js"
export { default as isPromiseLike } from "./is/isPromiseLike.js"

const { toString } = Object.prototype

export const isPositiveInteger = (x) => x >>> 0 === x
export const { isSafeInteger } = Number
export const { isInteger } = Number
export const { isFinite } = Number
export const { isNaN } = Number
export const isNumber = (x) => typeof x === "number"
export const isFloat = (x) => isFinite(x) && isInteger(x) === false

export const isNil = (x) => x == undefined
export const isNull = (x) => x === null
export const isUndefined = (x) => x === undefined
export const isFalsy = (x) => Boolean(x) === false
export const isTruthy = (x) => Boolean(x) === true

export const { isFrozen } = Object
export const { isArray } = Array
export const isTemplateObject = (x) => Array.isTemplateObject(x)
export const isBoolean = (x) => typeof x === "boolean"
export const isString = (x) => typeof x === "string"
export const isSymbol = (x) => typeof x === "symbol"
export const isFunction = (x) => typeof x === "function"
export const isSet = (x) => x instanceof Set
export const isMap = (x) => x instanceof Map
export const isDate = (x) => x instanceof Date
export const isError = (x) => x instanceof Error
export const isPromise = (x) => x instanceof Promise

export const isMapOrSet = (x) => isMap(x) || isSet(x)

export const isErrorLike = (x) =>
  x &&
  typeof x === "object" &&
  (x instanceof Error || (x.constructor && x.constructor.name === "ErrorEvent"))

// @thanks https://github.com/tc39/ecmascript-asyncawait/issues/78#issuecomment-167162901
// const GeneratorFunction = Reflect.getPrototypeOf(function* () {})
// const AsyncFunction = Reflect.getPrototypeOf(async () => {})
// export const isGeneratorFunction = (x) => x instanceof GeneratorFunction
// export const isAsyncFunction = (x) => x instanceof AsyncFunction

export const isIterable = (x) =>
  Boolean(x) && typeof x[Symbol.iterator] === "function"

export const isIterator = (x) =>
  x !== null &&
  typeof x === "object" &&
  typeof x.next === "function" &&
  typeof x[Symbol.iterator] === "function" &&
  x[Symbol.iterator]() === x

export const isObjectLike = (x) => x !== null && typeof x === "object"

export const isObject = (x) =>
  x !== null && typeof x === "object" && toString.call(x) === "[object Object]"

export const isPlainObject = (x) =>
  x !== null && typeof x === "object" && x.constructor === Object

export const isHashmap = (x) =>
  x !== null && typeof x === "object" && Object.getPrototypeOf(x) === null

export const isPlainObjectOrHashmap = (x) =>
  x !== null &&
  typeof x === "object" &&
  (Object.getPrototypeOf(x) === null || x.constructor === Object)

export const isEmptyArray = (x) => x?.length === 0

export const isArrayBuffer = (x) => x instanceof ArrayBuffer

const TypedArray = Reflect.getPrototypeOf(Int8Array)
export const isTypedArray = (x) => x instanceof TypedArray
export const isDataView = (x) => x instanceof DataView
export const isArrayBufferView = (x) => ArrayBuffer.isView(x)

export const isEmpty = (x) => {
  const type = typeof x
  return (
    type !== "boolean" &&
    (Boolean(x) === false ||
      (type === "object"
        ? isLength(x.length)
          ? x.length === 0
          : isLength(x.size)
          ? x.size === 0
          : isLength(x.byteLength)
          ? x.byteLength === 0
          : isEmptyObject(x)
        : false))
  )
}

// export const isCircular = (x) => isObjectLike(x) && detectCircular(x)
