import postfixPath from "../../core/path/core/postfixPath.js"
import disk from "../../core/disk.js"

export default function incrementFilename(base, dir = "/") {
  let cnt = 1
  const unpostfixed = base
  while (disk.has(dir + base)) {
    base = postfixPath(unpostfixed, `-${++cnt}`)
  }

  return base
}
