//! Copyright (c) 2014-2021 Denis Pushkarev. MIT Licence.
// @src https://github.com/zloirock/core-js/blob/master/packages/core-js/modules/esnext.array.is-template-object.js
// https://github.com/tc39/proposal-array-is-template-object

globalThis.system42?.polyfills.push("Array.isTemplateObject")

const { isFrozen } = Object
const { isArray } = Array

function isFrozenStringArray(array, allowUndefined) {
  if (!isFrozen || !isArray(array) || !isFrozen(array)) return false
  let index = 0
  const { length } = array
  let element
  while (index < length) {
    element = array[index++]
    if (
      !(
        typeof element === "string" ||
        (allowUndefined && typeof element === "undefined")
      )
    ) {
      return false
    }
  }

  return length !== 0
}

function isTemplateObject(value) {
  if (!isFrozenStringArray(value, true)) return false
  const { raw } = value
  return !(raw.length !== value.length || !isFrozenStringArray(raw, false))
}

Object.defineProperty(Array, "isTemplateObject", {
  writable: true,
  configurable: true,
  value: isTemplateObject,
})
