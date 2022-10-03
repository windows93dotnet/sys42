/* eslint-disable unicorn/prefer-top-level-await */
import inIframe from "../core/env/realm/inIframe.js"
import Emitter from "../fabric/class/Emitter.js"
import listen from "../fabric/event/listen.js"
import dt from "../core/dt.js"

if (inIframe) {
  import("../core/ipc.js").then(({ default: ipc }) => {
    ipc.on("42_SANDBOX_DROP", ({ files }) => {
      if (files.length > 0) io.emit("files", Object.values(files))
    })
  })
}

listen({
  "prevent": true,
  "dragover || dragenter": false,
  async "drop"(e) {
    const { files } = await dt.import(e.dataTransfer)
    if (files.length > 0) io.emit("files", Object.values(files))
  },
})

// @read https://web.dev/file-handling/
if (
  "launchQueue" in globalThis &&
  "files" in globalThis.LaunchParams.prototype
) {
  globalThis.launchQueue.setConsumer(async ({ files }) => {
    if (files.length === 0) return
    const undones = []
    for (const handle of files) undones.push(handle.getFile())
    io.emit("files", await Promise.all(undones))
  })
}

export class IO extends Emitter {}

const io = new IO()

export default io
