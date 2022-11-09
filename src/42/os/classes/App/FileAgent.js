import isHashmapLike from "../../../fabric/type/any/is/isHashmapLike.js"
import isInstanceOf from "../../../fabric/type/any/is/isInstanceOf.js"
import getBasename from "../../../core/path/core/getBasename.js"
import disk from "../../../core/disk.js"

const _noSideEffects = Symbol("FileAgent._noSideEffects")
const _path = Symbol("FileAgent._path")
const _url = Symbol("FileAgent._url")
const _blob = Symbol("FileAgent._blob")
const _data = Symbol("FileAgent._data")
const _resetURL = Symbol("FileAgent._resetURL")

const dummyBlob = Promise.resolve(new Blob())

export default class FileAgent {
  [Symbol.for("observe")] = true

  static recycle(obj, key, init, manifest) {
    if (key in obj) obj[key].init(init)
    else obj[key] = new FileAgent(init, manifest)
  }

  constructor(init, manifest) {
    this.manifest = manifest
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
      if ("path" in init) {
        if ("data" in init || "blob" in init) this[_noSideEffects] = true
        this.path = init.path
        this[_noSideEffects] = false
      }

      if ("data" in init) this.data = init.data
      if ("blob" in init) this.blob = init.blob

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
    if (this[_noSideEffects]) return
    this.name = val ? getBasename(val) : undefined
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
  set blob(data) {
    if (data === undefined) this[_data].length = 0
    else this[_data] = [data]
    this[_blob] = undefined
    if (data?.name && !this.name) this.name = data.name
    this.id = undefined
    this.url = undefined
    this.text = undefined
    this.stream = undefined
  }

  get data() {
    return this[_data]
  }
  set data(data) {
    if (data === undefined) this[_data].length = 0
    else this[_data] = [data]
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
        const { id } = await disk.getIdAndMask(this.path)
        if (id === 0) {
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
  set text(val) {}

  append(data) {
    this[_data].push(data)
    this[_blob] = undefined
    this[_resetURL]()
  }

  destroy() {
    this.path = undefined
  }
}
