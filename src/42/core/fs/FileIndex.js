import Storable from "../../fabric/classes/Storable.js"
import Locator from "../../fabric/classes/Locator.js"
import exists from "../../fabric/locator/exists.js"
import FileSystemError from "./FileSystemError.js"
import configure from "../configure.js"
import joinPath from "../../core/path/core/joinPath.js"
import sortPath from "../../core/path/core/sortPath.js"
import emittable from "../../fabric/traits/emittable.js"
import isDirDescriptor from "./isDirDescriptor.js"
import isGlob from "../path/isGlob.js"
import glob, { Glob } from "../../core/path/glob.js"
import normalizeFilename from "./normalizeFilename.js"
import inIframe from "../env/realm/inIframe.js"

const DEFAULTS = {
  name: "fileindex",
  delimiter: "/",
  hashmap: true,
  // durability: "relaxed",
}

const ParentClass = inIframe ? Locator : Storable

export default class FileIndex extends ParentClass {
  constructor(value, options) {
    super(value, configure(DEFAULTS, options))
    emittable(this)
  }

  async set(path, inode, options) {
    if (options?.silent !== true) {
      this.emit("change", path, "set", inode)

      const segments = exists.segmentize(path, this.delimiter)
      segments.pop()
      while (segments.length > 0) {
        if (!exists.run(this.value, segments)) {
          const dirnode = Object.create(null)
          const path = `/${segments.join("/")}`
          this.emit("change", path, "set", dirnode)
        }

        segments.pop()
      }
    }

    await super.set(path, inode)
  }

  async delete(path, options) {
    if (options?.silent !== true) this.emit("change", path, "delete")
    await super.delete(path)
  }
  async clear(options) {
    if (options?.silent !== true) this.emit("change", "/", "clear")
    await super.clear()
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

  glob(patterns, options) {
    const paths = glob.locate(this.value, patterns)
    return options?.sort === false ? paths : sortPath(paths, options?.sort)
  }

  isDir(path) {
    return isDirDescriptor(this.get(path))
  }

  isFile(path) {
    const desc = this.get(path)
    return Array.isArray(desc) || desc === 0
  }

  isLink(path) {
    const desc = this.get(path)
    return Array.isArray(desc) && desc[0] === -1
  }

  link(source, destination) {
    const desc = this.get(source)
    if (desc === undefined) {
      throw new FileSystemError(FileSystemError.ENOENT, source)
    }

    this.set(destination, [-1, source])
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
          } else names.push(res + this.delimiter)
        } else names.push(res)
      }
    }

    if (parent && names.length === 0) names.push(parent + this.delimiter)

    return sortPath(names)
  }
}
