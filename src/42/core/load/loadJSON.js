import httpGet from "../http.js"
import JSON5 from "../formats/json5.js"

export function loadJSON(url, ...options) {
  return httpGet(url, { headers: { Accept: "application/json" } }, ...options) //
    .then((res) => res.text())
    .then((text) => JSON5.parse(text))
}

export default loadJSON
