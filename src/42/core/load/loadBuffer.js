import httpGet from "../http.js"

export default function loadBuffer(url, ...options) {
  return httpGet(url, ...options).then((res) => res.arrayBuffer())
}
