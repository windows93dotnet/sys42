// @src https://developer.mozilla.org/en-US/docs/Glossary/Transferable_objects#supported_objects
export const TRANSFERABLES = new Set([
  "ArrayBuffer",
  "MessagePort",
  "ReadableStream",
  "WritableStream",
  "TransformStream",
  "WebTransportReceiveStream",
  "WebTransportSendStream",
  "AudioData",
  "ImageBitmap",
  "VideoFrame",
  "OffscreenCanvas",
  "RTCDataChannel",
])

export function isTransferable(val) {
  if (!val) return false
  if (typeof val !== "object") return false
  const tag = val[Symbol.toStringTag] || val.constructor?.name
  return TRANSFERABLES.has(tag)
}

export default isTransferable
