import ensureArrayBuffer from "./ensureArrayBuffer.js"
import { base64FromArrayBuffer } from "../../core/formats/base64.js"

/**
 * Cryptographic hash function.\
 * Hashes input value and returns the digest as an base64 or hex string.\
 *
 * @thanks https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API/Non-cryptographic_uses_of_subtle_crypto#hashing_a_file
 *
 * @param {string | File | Blob | Response | ArrayBuffer | ArrayBufferView} val
 * @param {{ algo?: AlgorithmIdentifier; output?: "base64" | "hex" }} [options]
 * @returns {Promise<string | ArrayBuffer>}
 */
export async function checksum(val, options) {
  const algo = options?.algo ?? "SHA-256"
  const output = options?.output ?? "base64"

  // @ts-ignore
  if (val?.arrayBuffer) val = await val.arrayBuffer()

  // @ts-ignore
  const buffer = ensureArrayBuffer(val)
  const digest = await crypto.subtle.digest(algo, buffer)

  if (output === "base64") return base64FromArrayBuffer(digest)

  if (output === "hex") {
    let str = ""
    for (const b of new Uint8Array(digest)) {
      str += b.toString(16).padStart(2, "0")
    }

    return str
  }

  return digest
}

export default checksum
