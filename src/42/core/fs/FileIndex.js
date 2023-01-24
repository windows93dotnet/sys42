import Storable from "../../fabric/classes/Storable.js"
import FileSystemError from "./FileSystemError.js"
import configure from "../configure.js"
import assertPath from "../../core/path/assertPath.js"
import joinPath from "../../core/path/core/joinPath.js"
import sortPath from "../../core/path/core/sortPath.js"
import emittable from "../../fabric/traits/emittable.js"
import isDirDescriptor from "./isDirDescriptor.js"
import isGlob from "../path/isGlob.js"
import glob, { Glob } from "../../core/path/glob.js"
import normalizeDirname from "./normalizeDirname.js"
import normalizeFilename from "./normalizeFilename.js"
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
    this.emit("change", path, "set", val)
    return super.set(path, val)
  }
  async delete(path) {
    console.log({ delete: path })
    this.emit("change", path, "delete")
    return super.delete(path)
  }
  async clear() {
    this.emit("change", "/", "clear")
    return super.clear()
  }

  watch(pattern, options, fn) {
    pattern = normalizeFilename(pattern)

    if (typeof options === "function") fn = options
    const signal = options?.signal

    if (isGlob(pattern)) {
      const glob = new Glob(pattern)
      return this.on("change", { signal, off: true }, (path, type) => {
        if (glob.test(path)) fn(path, type)
      })
    }

    return this.on("change", { signal, off: true }, (path, type) => {
      if (path === pattern) fn(path, type)
    })
  }

  watchDir(dirname, options, fn) {
    dirname = normalizeDirname(assertPath(dirname))

    if (typeof options === "function") fn = options
    const signal = options?.signal

    const tokens = tokenizePath(dirname)

    return this.on("change", { signal, off: true }, (path, type) => {
      if (path.startsWith(dirname)) {
        const changed = options?.directChild
          ? `${dirname}${tokenizePath(path).at(tokens.length)}`
          : path
        const hasPath = this.has(changed)
        if (
          (type === "set" && !hasPath) ||
          (type === "delete" && hasPath) ||
          type === "clear"
        ) {
          fn(changed, type, path)
        }
      }
    })
  }

  glob(patterns, options) {
    const paths = glob.locate(this.root, patterns)
    return options?.sort === false ? paths : sortPath(paths, options?.sort)
  }

  isDir(path) {
    return isDirDescriptor(this.get(path))
  }

  isFile(path) {
    const desc = this.get(path)
    return Array.isArray(desc) || desc === 0
  }

  readDir(path, options = {}, parent = "") {
    const { recursive, absolute } = options
    const dir = this.get(path)

    if (dir === undefined) {
      throw new FileSystemError(FileSystemError.ENOENT, path)
    } else if (Array.isArray(dir) || dir === 0) {
      throw new FileSystemError(FileSystemError.ENOTDIR, path)
    }

    const names = []

    for (const key in dir) {
      if (Object.hasOwn(dir, key)) {
        const desc = dir[key]
        const res = absolute ? joinPath(path, key) : joinPath(parent, key)
        if (isDirDescriptor(desc)) {
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
