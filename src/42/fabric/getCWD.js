import getParentModule from "./getParentModule.js"
import dirname from "./type/path/extract/dirname.js"

export default function getCWD(reg) {
  let { url } = getParentModule(reg)
  if (url === "about:srcdoc") return "/"
  if (url.endsWith("/")) url += "index.html"
  return dirname(new URL(url).pathname)
}
