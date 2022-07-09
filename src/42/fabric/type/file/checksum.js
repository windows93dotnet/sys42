// @thanks https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API/Non-cryptographic_uses_of_subtle_crypto

/**
 * Cryptographic hash function.
 * Hashes input value and returns the digest as an hex string.
 * @param {string | File | Blob | ArrayBuffer | TypedArray} val
 * @param {string} algorithm
 * @returns {string}
 */
export default async function checksum(val, algorithm = "SHA-256") {
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

  const digest = await crypto.subtle.digest(algorithm, buffer)

  let str = ""
  for (const b of new Uint8Array(digest)) str += b.toString(16).padStart(2, "0")

  return str
}