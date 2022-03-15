/* eslint-disable unicorn/no-object-as-default-parameter */
import Storable from "../../fabric/class/Storable.js"
import FileSystemError from "./FileSystemError.js"
import joinPath from "../../fabric/type/path/core/joinPath.js"
import sortPath from "../../fabric/type/path/core/sortPath.js"
import sortGlobResults from "../../fabric/type/path/core/sortGlobResults.js"
import glob from "../../fabric/type/path/glob.js"

export default class FileIndex extends Storable {
  constructor(root = {}) {
    super(root, {
      name: "🗃️ - File Index",
      sep: "/",
    })
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
      throw new FileSystemError(FileSystemError.ENOENT)
    } else if (typeof dir !== "object") {
      throw new FileSystemError(FileSystemError.ENOTDIR)
    }

    const names = []

    for (const key in dir) {
      if (Object.hasOwnProperty.call(dir, key)) {
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

  glob(patterns, { sort } = { sort: true }) {
    const paths = glob.locate(this.root, patterns)
    return sort ? sortGlobResults(paths) : paths
  }
}
