/* eslint-disable eqeqeq */
// @thanks https://github.com/jonschlinkert/is-plain-object
// @thanks https://stackoverflow.com/a/32538867
// @thanks https://github.com/lodash/lodash/blob/master/isLength.js
// @related https://github.com/chaijs/type-detect/blob/master/index.js

import isEmptyObject from "./is/isEmptyObject.js"
import isLength from "./is/isLength.js"
import isInstanceOf from "./is/isInstanceOf.js"

export { default as isInstanceOf } from "./is/isInstanceOf.js"
export { default as isDirectInstanceOf } from "./is/isDirectInstanceOf.js"

// TODO: move more usefull is* functions in `any/is` folder
export { default as isObject } from "./is/isObject.js"
export { default as isObjectOrArray } from "./is/isObjectOrArray.js"
export { default as isPlainObject } from "./is/isPlainObject.js"
export { default as isHashmap } from "./is/isHashmap.js"
export { default as isHashmapLike } from "./is/isHashmapLike.js"
export { default as isEmptyObject } from "./is/isEmptyObject.js"
export { default as isProxy } from "./is/isProxy.js"
export { default as isLength } from "./is/isLength.js"
export { default as isArrayLike } from "./is/isArrayLike.js"
export { default as isIterable } from "./is/isIterable.js"
export { default as isPromiseLike } from "./is/isPromiseLike.js"
export { default as isTemplateObject } from "./is/isTemplateObject.js"
export { default as isErrorLike } from "./is/isErrorLike.js"
export { default as isGeneratorFunction } from "./is/isGeneratorFunction.js"
export { default as isAsyncFunction } from "./is/isAsyncFunction.js"
export { default as isMultipleOf } from "../number/isMultipleOf.js"

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
export const isBoolean = (x) => typeof x === "boolean"
export const isString = (x) => typeof x === "string"
export const isSymbol = (x) => typeof x === "symbol"
export const isFunction = (x) => typeof x === "function"
export const isSet = (x) => isInstanceOf(x, Set)
export const isMap = (x) => isInstanceOf(x, Map)
export const isDate = (x) => isInstanceOf(x, Date)
export const isError = (x) => isInstanceOf(x, Error)
export const isPromise = (x) => isInstanceOf(x, Promise)

export const isMapOrSet = (x) => isMap(x) || isSet(x)

export const isIterator = (x) =>
  x !== null &&
  typeof x === "object" &&
  typeof x.next === "function" &&
  typeof x[Symbol.iterator] === "function" &&
  x[Symbol.iterator]() === x

export const isEmptyArray = (x) => x?.length === 0

export const isArrayBuffer = (x) => isInstanceOf(x, ArrayBuffer)

const TypedArray = Reflect.getPrototypeOf(Int8Array)
export const isTypedArray = (x) => isInstanceOf(x, TypedArray)
export const isDataView = (x) => isInstanceOf(x, DataView)
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

export const isElement = (x) => x?.nodeType === Node.ELEMENT_NODE
