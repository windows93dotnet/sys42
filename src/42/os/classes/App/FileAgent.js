import isHashmapLike from "../../../fabric/type/any/is/isHashmapLike.js"
import isInstanceOf from "../../../fabric/type/any/is/isInstanceOf.js"
import getBasename from "../../../core/path/core/getBasename.js"
import disk from "../../../core/disk.js"

const _noSideEffects = Symbol("FileAgent._noSideEffects")
const _path = Symbol("FileAgent._path")
const _url = Symbol("FileAgent._url")
const _blob = Symbol("FileAgent._blob")
const _data = Symbol("FileAgent._data")
const _locked = Symbol("FileAgent._locked")
const _resetURL = Symbol("FileAgent._resetURL")

const dummyBlob = Promise.resolve(new Blob())

export default class FileAgent {
  [Symbol.for("observe")] = true;

  [Symbol.for("serialize")]() {
    return { path: this.path, id: this.id }
  }

  static recycle(obj, key, init) {
    if (key in obj) {
      if (obj[key] instanceof FileAgent) {
        if (init) obj[key].init(init)
      } else obj[key] = new FileAgent(init ?? obj[key])
    } else obj[key] = new FileAgent(init)
  }

  constructor(init) {
    this[_data] = []
    this.dirty = false
    this.init(init)
  }

  init(init) {
    this[_noSideEffects] = false
    const type = typeof init
    if (type === "string") {
      this.path = init
    } else if (isHashmapLike(init)) {
      const blob = init.file ?? init.blob
      if ("path" in init) {
        if (init.noSideEffects || "data" in init || blob) {
          this[_noSideEffects] = true
        }

        this.path = init.path
        this[_noSideEffects] = false
      }

      if ("data" in init) this.data = init.data
      else if (blob) this.blob = blob

      if ("id" in init) this.id = init.id
      if ("dirty" in init) this.dirty = init.dirty
    } else if (isInstanceOf(init, Blob)) {
      this[_noSideEffects] = true
      this.path = undefined
      this[_noSideEffects] = false
      this.blob = init
    } else {
      this.path = undefined
    }
  }

  get path() {
    return this[_path]
  }
  set path(val) {
    this[_path] = val
    this[_data].length = 0
    this.name = val ? getBasename(val) : undefined
    if (this[_noSideEffects]) return
    this.id = undefined
    this.blob = undefined
    this.dirty = false
  }
  updatePath(val) {
    this[_noSideEffects] = true
    this.path = val
    this[_noSideEffects] = false
  }

  get blob() {
    if (this[_blob]) return Promise.resolve(this[_blob])
    if (this[_data].length > 0) {
      this[_blob] = new Blob(this[_data])
      return Promise.resolve(this[_blob])
    }

    if (!this.path) return dummyBlob

    return import("../../../core/fs.js") //
      .then(({ default: fs }) => fs.open(this.path))
      .then((blob) => {
        this[_blob] = blob
        return this[_blob]
      })
  }
  set blob(val) {
    if (val === undefined) this[_data].length = 0
    else this[_data] = [val]
    this[_blob] = undefined
    if (val?.name && !this.name) this.name = val.name
    this.id = undefined
    this.url = undefined
    this.text = undefined
    this.stream = undefined
  }

  get data() {
    return this[_data]
  }
  set data(val) {
    if (val === undefined) this[_data].length = 0
    else this[_data] = [val]
    this[_blob] = undefined
    this[_resetURL]()
    this.dirty = true
  }

  [_resetURL]() {
    if (this[_url]) URL.revokeObjectURL(this[_url])
    this[_url] = undefined
  }
  get url() {
    if (this[_url]) return this[_url]

    return (async () => {
      if (this.path) {
        const desc = await disk.get(this.path)
        if (desc === 0) {
          this[_url] = this.path
          return this[_url]
        }
      }

      const blob = await this.blob
      this[_url] = URL.createObjectURL(blob)
      return this[_url]
    })()
  }
  set url(val) {
    this[_resetURL]()
  }

  get stream() {
    if (this[_blob]) return this[_blob].stream()
    return this.blob.then((blob) => blob.stream())
  }
  set stream(val) {}

  get text() {
    if (this[_blob]) return this[_blob].text()
    return this.blob.then((blob) => blob.text())
  }
  set text(val) {
    this.data = val
  }

  get locked() {
    return this[_locked]
  }
  set locked(val) {
    this[_locked] = Boolean(val)
  }

  append(val) {
    this[_data].push(val)
    this[_blob] = undefined
    this[_resetURL]()
  }

  destroy() {
    this.path = undefined
  }
}
