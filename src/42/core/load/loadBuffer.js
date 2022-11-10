import httpGet from "../http.js"

export function loadBuffer(url, ...options) {
  return httpGet(url, ...options).then((res) => res.arrayBuffer())
}

export default loadBuffer
