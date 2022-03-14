// [1] wait for firefox implementation
// https://bugzilla.mozilla.org/show_bug.cgi?id=1556604
// https://bugzilla.mozilla.org/show_bug.cgi?id=1749547

// @src https://developer.mozilla.org/en-US/docs/Glossary/Transferable_objects#supported_objects
const TRANSFERABLES = new Set([
  // "ArrayBuffer",
  "MessagePort",
  // "ReadableStream", [1]
  // "WritableStream", [1]
  // "TransformStream", [1]
  "AudioData",
  "ImageBitmap",
  "VideoFrame",
  "OffscreenCanvas",
])

// @src https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#supported_types
const CLONABLE = new Set([
  "Boolean",
  "String",
  "Date",
  "RegExp",
  "Blob",
  "File",
  "FileList",
  "ArrayBuffer",
  "ArrayBufferView",
  "ImageBitmap",
  "ImageData",
  "Array",
  "Object",
  "Map",
  "Set",
  // "Error", [1]
  "DOMRect",
])

const PRIMITIVES = new Set(["boolean", "string", "number", "bigint"])

const { toString } = Object.prototype

export default function isSerializable(value) {
  if (!value) return 1
  const type = typeof value
  if (PRIMITIVES.has(type)) return 1
  if (type !== "object") return 0
  const tag = value[Symbol.toStringTag] || toString.call(value).slice(8, -1)
  if (CLONABLE.has(tag)) return 1
  if (TRANSFERABLES.has(tag)) return 2
  if ("toJSON" in value) return 3
  return 0
}
