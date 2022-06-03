import resolvePath from "../fabric/type/path/core/resolvePath.js"

export default function resolve(scope, path) {
  return resolvePath(scope, String(path)).replaceAll(".", "/")
}
