/* eslint-disable guard-for-in */

// @read https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties#Detection_Table

// ✔ Enumerable
// ✔ Nonenumerable
// ✔ Symbols keys
// ✔ Inherited Enumerable
// ✖ Inherited Nonenumerable
// ✖ Inherited Symbols keys

const IGNORE_INHERITED = new Set([
  "constructor",
  "__proto__",
  "caller",
  "callee",
  "arguments",
])

export function allKeys(obj, inherited) {
  const keys = Reflect.ownKeys(obj)
  let lastIndex = 0

  for (const key in obj) {
    if (keys.includes(key) === false) {
      keys.splice(lastIndex, 0, key)
      lastIndex++
    }

    lastIndex++
  }

  if (!inherited) return keys

  const proto = Object.getPrototypeOf(obj)
  if (proto) {
    const desc = Object.getOwnPropertyDescriptors(proto)
    for (const key in desc) {
      if (!keys.includes(key) && !IGNORE_INHERITED.has(key) && desc[key].get) {
        keys.push(key)
      }
    }
  }

  return keys
}

export default allKeys
