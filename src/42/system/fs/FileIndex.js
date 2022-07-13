import Storable from "../../fabric/class/Storable.js"
import FileSystemError from "./FileSystemError.js"
import configure from "../../fabric/configure.js"
import joinPath from "../../fabric/type/path/core/joinPath.js"
import sortPath from "../../fabric/type/path/core/sortPath.js"
import sortGlobResults from "../../fabric/type/path/core/sortGlobResults.js"
import glob from "../../fabric/type/path/glob.js"

const DEFAULTS = {
  name: "fileindex",
  sep: "/",
}

export default class FileIndex extends Storable {
  constructor(root = {}, options) {
    super(root, configure(DEFAULTS, options))
  }

  isDir(path) {
    return typeof this.get(path) === "object"
  }

  isFile(path) {
    return typeof this.get(path) !== "object"
  }

  readDir(path, options = {}, parent = "") {
    const { recursive, absolute } = options
    const dir = this.get(path)

    if (dir === undefined) {
      throw new FileSystemError(FileSystemError.ENOENT, path)
    } else if (typeof dir !== "object") {
      throw new FileSystemError(FileSystemError.ENOTDIR, path)
    }

    const names = []

    for (const key in dir) {
      if (Object.hasOwn(dir, key)) {
        const entry = dir[key]
        const res = absolute ? joinPath(path, key) : joinPath(parent, key)
        if (typeof entry === "object") {
          if (recursive) {
            names.push(...this.readDir(`${path}/${key}`, options, res))
          } else names.push(res + this.sep)
        } else names.push(res)
      }
    }

    if (parent && names.length === 0) names.push(parent + this.sep)

    return sortPath(names)
  }

  glob(patterns, { sort } = {}) {
    const paths = glob.locate(this.root, patterns)
    return sort === false ? paths : sortGlobResults(paths)
  }
}
