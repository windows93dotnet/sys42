import extname from "../extract/extname.js"

export default function removeExt(path) {
  return path.slice(0, -extname(path).length)
}
