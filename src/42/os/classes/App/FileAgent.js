import isHashmapLike from "../../../fabric/type/any/is/isHashmapLike.js"
import isInstanceOf from "../../../fabric/type/any/is/isInstanceOf.js"

export default class FileAgent {
  #data
  #blob
  #url

  constructor(init, manifest) {
    this.manifest = manifest
    const type = typeof init
    if (type === "string") {
      this.path = init
    } else if (isHashmapLike(init)) {
      this.id = init.id
      this.path = init.path
      this.dirty = init.dirty
      this.#data = init.data
    } else if (isInstanceOf(init, Blob)) {
      this.#data = init
    }
  }

  get data() {
    if (this.#blob) return Promise.resolve(this.#blob)
    if (this.#data) {
      this.#blob = new Blob([this.#data])
      return Promise.resolve(this.#blob)
    }

    return import("../../../core/fs.js") //
      .then(({ default: fs }) => fs.open(this.path))
      .then((blob) => {
        this.#blob = blob
        return this.#blob
      })
  }
  set data(data) {
    console.log(99, data)
    this.#data = data
    this.#blob = undefined
    if (this.#url) URL.revokeObjectURL(this.#url)
    this.#url = undefined
    this.dirty = true
  }

  get url() {
    if (this.#url) return this.#url
    return this.data.then((blob) => {
      this.#url = URL.createObjectURL(blob)
      return this.#url
    })
  }

  get stream() {
    if (this.#blob) return this.#blob.stream()
    return this.data.then((blob) => blob.stream())
  }

  destroy() {
    if (this.#url) URL.revokeObjectURL(this.#url)
    this.#url = undefined
    this.#data = undefined
    this.path = undefined
    this.dirty = undefined
  }

  toJSON() {
    return {
      id: this.id,
      path: this.path,
      dirty: this.dirty,
      data: this.#data,
    }
  }
}
