// @thanks https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API/Non-cryptographic_uses_of_subtle_crypto

export default async function fileHash(file, algorithm = "SHA-256") {
  const buffer =
    file instanceof ArrayBuffer
      ? file
      : typeof file === "string"
      ? new TextEncoder().encode(file)
      : "arrayBuffer" in file
      ? await file.arrayBuffer()
      : "buffer" in file
      ? file.buffer
      : new TextEncoder().encode(String(file))

  const hash = await crypto.subtle.digest(algorithm, buffer)

  let str = ""
  for (const b of new Uint8Array(hash)) str += b.toString(16).padStart(2, "0")

  return str
}
