/* eslint-disable unicorn/no-this-assignment */
/* eslint-disable no-constructor-return */
import FileLocator from "./FileLocator.js"
import Canceller from "../../fabric/classes/Canceller.js"
import CBOR from "../formats/cbor.js"
import ipc from "../ipc.js"

export const MASKS = {
  0x00: "fetch",
  0x10: "memory",
  0x11: "sessionstorage",
  0x12: "localstorage",
  0x13: "indexeddb",
}

function syncFileIndex(instance) {
  ipc.on("42_DISK_CHANGE", ([path, type, inode]) => {
    if (type === "set") {
      if (inode !== undefined) instance[type](path, inode)
    } else instance[type](path)
  })
}

let ExportedClass

if (ipc.inIframe) {
  ExportedClass = class DiskIPC extends FileLocator {
    synced = false

    async init() {
      if (this.synced) return

      // Sync file index with top-level realm
      this.value = await ipc.send("42_DISK_INIT")
      this.synced = true

      syncFileIndex(this)

      if (!ipc.inWorker) {
        globalThis.addEventListener("pagehide", () => ipc.emit("42_DISK_CLOSE"))
      }
    }
  }
} else {
  const populate = async () => {
    const url = new URL("/files.cbor", import.meta.url)
    const res = await fetch(url)
    return res.status === 200 ? CBOR.decode(await res.arrayBuffer()) : {}
  }

  let instance

  ExportedClass = class Disk extends FileLocator {
    synced = false

    constructor() {
      if (instance) {
        console.warn("Disk already initialized")
        return instance
      }

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
        .on("42_DISK_SYNC", async (_, { emit }) => {
          this.on("change", (...args) => emit("42_DISK_CHANGE", args))
        })
        .on("42_DISK_CLOSE", async (_, { port }) => {
          if (ports.has(port)) {
            const cancel = ports.get(port)
            cancel()
            ports.delete(port)
          }
        })
    }

    async init(target) {
      if (target) {
        if (target === true) {
          const [value] = await ipc.send("42_DISK_INIT")
          this.value = value
          this.synced = true
        } else {
          const value = await ipc.to(target).sendOnce("42_DISK_INIT")
          this.value = value
          this.synced = true
        }
      } else {
        await super.init()
        this.synced = true
        if (ipc.inWorker) ipc.emit("42_DISK_SYNC")
      }

      if (ipc.inWorker) syncFileIndex(this)
    }
  }
}

export { ExportedClass as Disk }
export default ExportedClass
