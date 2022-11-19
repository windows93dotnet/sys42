import httpGet from "../http.js"

export async function loadText(url, encoding, ...options) {
  if (typeof encoding !== "string") {
    options.unshift(encoding)
    encoding = undefined
  }

  const res = await httpGet(url, ...options)

  return encoding
    ? new TextDecoder(encoding).decode(await res.arrayBuffer())
    : res.text()
}

export default loadText
