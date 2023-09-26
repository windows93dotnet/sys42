import postfixPath from "../../core/path/core/postfixPath.js"
import fileIndex from "../fileIndex.js"

export default function incrementFilename(base, dir = "/") {
  let cnt = 1
  const unpostfixed = base
  while (fileIndex.has(dir + base)) {
    base = postfixPath(unpostfixed, `-${++cnt}`)
  }

  return base
}
