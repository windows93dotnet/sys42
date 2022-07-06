import system from "../../system.js"
import normalizePath from "../../fabric/type/path/core/normalizePath.js"

export default function systemPath(path) {
  return normalizePath(path).replaceAll("$HOME", system.HOME)
}
