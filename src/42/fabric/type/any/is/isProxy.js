import isSerializable from "./isSerializable.js"

export default function isProxy(value) {
  if (!value || typeof value !== "object") return false

  if (value[Symbol.toStringTag] === "[object Proxy]") return true
  const res = isSerializable(value)

  if (res) {
    try {
      structuredClone(value)
    } catch {
      return true
    }
  }

  return false
}
