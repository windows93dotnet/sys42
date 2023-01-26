import fs from "../../core/fs.js"
import getBasename from "../../core/path/core/getBasename.js"
import resolvePath from "../../core/path/core/resolvePath.js"
import arrify from "../../fabric/type/any/arrify.js"

export default async function movePaths(selection, dest, options) {
  dest = resolvePath(dest) + "/"
  for (const from of arrify(selection)) {
    const to = dest + getBasename(from)
    fs.move(from, to, options)
  }
}
