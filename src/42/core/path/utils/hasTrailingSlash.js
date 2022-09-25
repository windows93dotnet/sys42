export default function hasTrailingSlash(path) {
  return path.charCodeAt(path.length - 1) === 47 /* / */
}
