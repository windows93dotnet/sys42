export default async function ensureBuffer(val) {
  const buffer =
    val instanceof ArrayBuffer
      ? val
      : typeof val === "string"
      ? new TextEncoder().encode(val)
      : val?.buffer ?? (val?.arrayBuffer ? await val.arrayBuffer() : undefined)

  if (!buffer) {
    throw new TypeError(
      `input must be a string, File, Blob, ArrayBuffer or TypedArray: ${typeof val}`
    )
  }

  return buffer
}
