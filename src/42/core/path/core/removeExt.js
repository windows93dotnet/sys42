import getExtname from "./getExtname.js"

export default function removeExt(path) {
  return path.slice(0, -getExtname(path).length)
}
