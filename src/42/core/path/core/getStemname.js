import getBasename from "./getBasename.js"
import getExtname from "./getExtname.js"

export default function getStemname(path) {
  return getBasename(path, getExtname(path))
}
