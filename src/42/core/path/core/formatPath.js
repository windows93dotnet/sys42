//! Copyright the Browserify authors. MIT License.
// @src https://github.com/substack/path-browserify

export default function formatPath(obj) {
  const type = typeof obj
  if (obj === null || type !== "object") {
    throw new TypeError(
      '"formatPath" argument must be of type Object. Received type ' + type,
    )
  }

  const dir = obj.dir ?? obj.root
  const base = obj.base ?? (obj.name ?? "") + (obj.ext ?? "")
  if (!dir) return base
  if (dir === obj.root) return dir + base
  return dir + "/" + base
}
