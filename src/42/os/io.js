import inIframe from "../core/env/realm/inIframe.js"
import Emitter from "../fabric/classes/Emitter.js"
import listen from "../fabric/event/listen.js"
import engage from "./engage.js"
import dt from "../core/dt.js"

export class IO extends Emitter {
  #forgets = []

  listen() {
    if (inIframe) {
      import("../core/ipc.js").then(({ default: ipc }) => {
        this.#forgets.push(
          ipc.on("42_SANDBOX_DROP", { off: true }, ({ files }) => {
            if (files.length > 0) this.emit("files", Object.values(files))
          })
        )
      })
    }

    this.#forgets.push(
      listen({
        "prevent": true,
        "dragover || dragenter": false,
        async "drop"(e) {
          const { files } = await dt.import(e.dataTransfer)
          if (files.length > 0) this.emit("files", Object.values(files))
        },
      })
    )

    // @read https://web.dev/file-handling/
    if (
      "launchQueue" in globalThis &&
      "files" in globalThis.LaunchParams.prototype
    ) {
      globalThis.launchQueue.setConsumer(async ({ files }) => {
        if (files.length === 0) return
        const undones = []
        for (const handle of files) undones.push(handle.getFile())
        this.emit("files", await Promise.all(undones))
      })
    }
  }

  destroy() {
    for (const forget of this.#forgets) forget()
    this.emit("destroy", this)
    this.off("*")
  }
}

const io = new IO()
Object.assign(io, engage)

export default io
