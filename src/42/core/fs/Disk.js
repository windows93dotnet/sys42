/* eslint-disable unicorn/no-this-assignment */
/* eslint-disable no-constructor-return */
import system from "../../system.js"
import FileIndex from "./FileIndex.js"
import CBOR from "../formats/cbor.js"

export const MASKS = {
  0x00: "fetch",
  0x10: "memory",
  0x11: "sessionstorage",
  0x12: "localstorage",
  0x13: "indexeddb",
}

export const RESERVED_BYTES = 0x80

const getFiles = async () => {
  const url = new URL("/files.cbor", import.meta.url)
  const res = await fetch(url)
  return res.status === 200 ? CBOR.decode(await res.arrayBuffer()) : {}
}

let instance

export default class Disk extends FileIndex {
  static MASKS = MASKS

  constructor() {
    if (instance) return instance

    super(getFiles)

    this.MASKS = MASKS
    this.RESERVED_BYTES = RESERVED_BYTES
    instance = this
  }

  get HOME() {
    return system.HOME
  }

  getIdAndMask(filename) {
    const id = this.get(filename)
    const mask = id % RESERVED_BYTES
    return { id, mask }
  }

  async format() {
    const fs = await import("../fs.js").then((m) => m.default)
    await fs.deleteDir("/")
  }

  async upgrade() {
    await this.populate(getFiles)
    await this.init()
  }

  async reinstall() {
    await this.format()
    await this.upgrade()
  }
}
