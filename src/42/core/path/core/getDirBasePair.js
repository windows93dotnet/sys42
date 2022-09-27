import getDirname from "./getDirname.js"
import getBasename from "./getBasename.js"

// TODO: benchmark if faster then parsePath.js
export default function getDirBasePair(path) {
  const dir = getDirname(path)
  const base = getBasename(path)
  return { dir, base }
}
