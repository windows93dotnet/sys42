import basename from "./basename.js"
import extname from "./extname.js"

export default function stemname(path) {
  return basename(path, extname(path))
}
