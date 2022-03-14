//! Copyright the Browserify authors. MIT License.
// @src https://github.com/substack/path-browserify

export default function assertPath(path) {
  const type = typeof path
  if (type !== "string") {
    throw new TypeError(`The "path" argument must be a string: ${type}`)
  }
}
