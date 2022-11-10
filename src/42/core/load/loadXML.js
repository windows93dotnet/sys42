import httpGet from "../http.js"
import disposable from "../../fabric/traits/disposable.js"

const getDOMParser = disposable(() => new DOMParser())
const mimeType = "application/xml"

export function loadXML(url, ...options) {
  return httpGet(url, ...options)
    .then((res) => res.text())
    .then((res) => getDOMParser().parseFromString(res, mimeType).firstChild)
}

export default loadXML
