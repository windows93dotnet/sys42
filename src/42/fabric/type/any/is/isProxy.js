import isSerializable from "./isSerializable.js"

export default function isProxy(value) {
  if (!value || typeof value !== "object") return false

  if (value[Symbol.for("isProxy")]) return true

  if (isSerializable(value)) {
    try {
      structuredClone(value)
    } catch {
      return true
    }
  }

  return false
}
