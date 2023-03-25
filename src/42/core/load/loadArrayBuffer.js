import httpGet from "../http.js"

export function loadArrayBuffer(url, ...options) {
  return httpGet(url, ...options).then((res) => res.arrayBuffer())
}

export default loadArrayBuffer
