import system from "../../system.js"
import resolvePath from "../path/core/resolvePath.js"

export default function normalizeFilename(path) {
  return resolvePath(path).replace("/$HOME", system.HOME)
}
