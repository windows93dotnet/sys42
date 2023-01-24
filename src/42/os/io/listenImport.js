import inIframe from "../../core/env/realm/inIframe.js"
import noop from "../../fabric/type/function/noop.js"

export default function listenImport(io) {
  if (inIframe) {
    import("../../core/ipc.js").then(({ default: ipc }) => {
      ipc
        .send("42_IO_READY")
        .then((files) => {
          io.emit("import", files)
        })
        .catch(noop)
    })
  }
}
