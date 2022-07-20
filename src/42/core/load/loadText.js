import httpGet from "../http.js"

export default function loadText(url, ...options) {
  return httpGet(url, ...options).then((res) => res.text())
}
