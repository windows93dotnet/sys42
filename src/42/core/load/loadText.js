import httpGet from "../http.js"

export function loadText(url, ...options) {
  return httpGet(url, ...options).then((res) => res.text())
}

export default loadText
