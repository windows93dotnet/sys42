/* eslint-disable unicorn/no-this-assignment */
/* eslint-disable no-constructor-return */
import FileIndex from "./FileIndex.js"
import Canceller from "../../fabric/classes/Canceller.js"
import CBOR from "../formats/cbor.js"
import inTop from "../env/realm/inTop.js"
import ipc from "../ipc.js"

export const MASKS = {
  0x00: "fetch",
  0x10: "memory",
  0x11: "sessionstorage",
  0x12: "localstorage",
  0x13: "indexeddb",
}

let ExportedClass

if (inTop) {
  const populate = async () => {
    const url = new URL("/files.cbor", import.meta.url)
    const res = await fetch(url)
    return res.status === 200 ? CBOR.decode(await res.arrayBuffer()) : {}
  }

  let instance

  class Disk extends FileIndex {
    constructor() {
      if (instance) return instance

      super(Object.create(null), { populate })

      instance = this

      const ports = new WeakMap()

      ipc
        .on("42_DISK_INIT", async (_, { port, emit }) => {
          const cancel = new Canceller()
          ports.set(port, cancel)
          const { signal } = cancel

          this.on("change", { signal }, (...args) => {
            emit("42_DISK_CHANGE", args)
          })

          await this.ready
          return this.value
        })
        .on("42_DISK_CLOSE", async (_, { port }) => {
          if (ports.has(port)) {
            const cancel = ports.get(port)
            cancel()
            ports.delete(port)
          }
        })
    }
  }

  ExportedClass = Disk
} else {
  class DiskIPC extends FileIndex {
    async init() {
      this.value = await ipc.send("42_DISK_INIT")

      ipc.on("42_DISK_CHANGE", ([path, type, inode]) => {
        if (type === "set") this[type](path, inode)
        else this[type](path)
      })

      globalThis.addEventListener("pagehide", () => ipc.emit("42_DISK_CLOSE"))
    }
  }

  ExportedClass = DiskIPC
}

export { ExportedClass as Disk }
export default ExportedClass
