import getParentModule from "./getParentModule.js"
import getDirname from "./type/path/core/getDirname.js"

export default function getCWD(reg) {
  let { url } = getParentModule(reg)
  if (url === "about:srcdoc") return "/"
  if (url.endsWith("/")) url += "index.html"
  return getDirname(new URL(url).pathname)
}
