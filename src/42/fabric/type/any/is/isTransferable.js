import isSerializable from "./isSerializable.js"

export default function isTransferable(value) {
  const res = isSerializable(value)
  return res === 2 || value?.constructor?.name === "ArrayBuffer"
}
