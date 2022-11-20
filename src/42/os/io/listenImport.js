import inIframe from "../../core/env/realm/inIframe.js"
import noop from "../../fabric/type/function/noop.js"

export default function listenImport(io) {
  const forgets = []
  if (inIframe) {
    import("../../core/ipc.js").then(({ default: ipc }) => {
      ipc
        .send("42_IO_READY")
        .then((files) => {
          io.emit("import", files)
        })
        .catch(noop)
      forgets.push(
        ipc.on("42_SANDBOX_DROP", { off: true }, ({ files, paths }) => {
          if (paths?.length > 0) io.emit("paths", paths)
          else {
            files = Object.values(files)
            if (files.length > 0) io.emit("import", files)
          }
        })
      )
    })
  }
}
