/* eslint-disable unicorn/no-this-assignment */
/* eslint-disable no-constructor-return */
import FileIndex from "./FileIndex.js"
import CBOR from "../formats/cbor.js"
import inTop from "../env/realm/inTop.js"

const bc = new BroadcastChannel("42_DISK")

export const MASKS = {
  0x00: "fetch",
  0x10: "memory",
  0x11: "sessionstorage",
  0x12: "localstorage",
  0x13: "indexeddb",
}

const getFiles = async () => {
  const url = new URL("/files.cbor", import.meta.url)
  const res = await fetch(url)
  return res.status === 200 ? CBOR.decode(await res.arrayBuffer()) : {}
}

let instance

export default class Disk extends FileIndex {
  constructor() {
    if (instance) return instance

    super(getFiles)

    instance = this

    bc.onmessage = ({ data: [path, type, val] }) => {
      this[type](path, val)
    }

    if (inTop) {
      this.on("change", (...args) => {
        bc.postMessage(args)
      })
    }
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
