import Storable from "../../fabric/classes/Storable.js"
import FileSystemError from "./FileSystemError.js"
import configure from "../configure.js"
import assertPath from "../../core/path/assertPath.js"
import joinPath from "../../core/path/core/joinPath.js"
import sortPath from "../../core/path/core/sortPath.js"
import emittable from "../../fabric/traits/emittable.js"
import glob from "../../core/path/glob.js"
import normalizeDirname from "../../core/path/utils/normalizeDirname.js"
import tokenizePath from "../../core/path/utils/tokenizePath.js"

const DEFAULTS = {
  name: "fileindex",
  sep: "/",
  hashmap: true,
}

export default class FileIndex extends Storable {
  constructor(root = Object.create(null), options) {
    super(root, configure(DEFAULTS, options))
    emittable(this)
  }

  async set(path, val) {
    this.emit("change", path, "set")
    return super.set(path, val)
  }
  async delete(path) {
    this.emit("change", path, "delete")
    return super.delete(path)
  }
  async clear() {
    this.emit("change", "/", "clear")
    return super.clear()
  }

  watch(pattern, options, fn) {
    if (typeof options === "function") fn = options
    const signal = options?.signal

    return this.on("change", { signal, off: true }, (path, type) => {
      if (glob.test(path, pattern)) fn(path, type)
    })
  }

  watchDir(dirname, options, fn) {
    if (typeof options === "function") fn = options
    const signal = options?.signal

    dirname = normalizeDirname(assertPath(dirname))
    const tokens = tokenizePath(dirname)

    return this.on("change", { signal, off: true }, (path, type) => {
      if (path.startsWith(dirname)) {
        const changed = `${dirname}${tokenizePath(path).at(tokens.length)}`
        if (
          (type === "set" && !this.has(changed)) ||
          (type === "delete" && this.has(changed)) ||
          type === "clear"
        ) {
          fn(changed, type)
        }
      }
    })
  }

  glob(patterns, options) {
    const paths = glob.locate(this.root, patterns)
    return options?.sort === false ? paths : sortPath(paths)
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
}
