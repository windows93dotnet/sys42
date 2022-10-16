import inIframe from "../../core/env/realm/inIframe.js"
import listen from "../../fabric/event/listen.js"
import dt from "../../core/dt.js"

export default function listenImport(io) {
  const forgets = []
  if (inIframe) {
    import("../../core/ipc.js").then(({ default: ipc }) => {
      forgets.push(
        ipc.on("42_SANDBOX_DROP", { off: true }, ({ files }) => {
          if (files.length > 0) io.emit("import", Object.values(files))
        })
      )
    })
  }

  forgets.push(
    listen({
      "prevent": true,
      "dragover || dragenter": false,
      async "drop"(e) {
        const { files } = await dt.import(e.dataTransfer)
        if (files.length > 0) io.emit("import", Object.values(files))
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
      io.emit("import", await Promise.all(undones))
    })
  }
}
