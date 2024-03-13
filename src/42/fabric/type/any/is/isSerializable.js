import isInstanceOf from "./isInstanceOf.js"

export const PRIMITIVES = new Set([
  "boolean", //
  "string",
  "number",
  "bigint",
])

// @src https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#supported_types
// @src https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#webapi_types
export const SERIALIZABLES = new Set([
  "Array",
  "ArrayBuffer",
  "Boolean",
  "DataView",
  "Date",
  "Map",
  "Number",
  "Object",
  "RegExp",
  "Set",
  "String",
  "AudioData",
  "Blob",
  "CropTarget",
  "CryptoKey",
  "DOMException",
  "DOMMatrix",
  "DOMMatrixReadOnly",
  "DOMPoint",
  "DOMPointReadOnly",
  "DOMQuad",
  "DOMRect",
  "DOMRectReadOnly",
  "File",
  "FileList",
  "FileSystemDirectoryHandle",
  "FileSystemFileHandle",
  "FileSystemHandle",
  "GPUCompilationInfo",
  "GPUCompilationMessage",
  "ImageBitmap",
  "ImageData",
  "RTCCertificate",
  "VideoFrame",
])

export function isSerializable(val) {
  if (!val) return true
  const type = typeof val
  if (PRIMITIVES.has(type)) return true
  if (type !== "object") return false
  if (ArrayBuffer.isView(val) || isInstanceOf(val, Error)) return true
  const tag = val[Symbol.toStringTag] || val.constructor?.name
  return SERIALIZABLES.has(tag)
}

export default isSerializable
