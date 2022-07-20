import BrowserDriver from "../BrowserDriver.js"
import ipc from "../../ipc.js"

class IPCDriver extends BrowserDriver {
  async open(...args) {
    return ipc.to.top.send("IPCDriver", { type: "open", args })
  }

  async write(...args) {
    return ipc.to.top.send("IPCDriver", { type: "write", args })
  }

  async delete(...args) {
    return ipc.to.top.send("IPCDriver", { type: "delete", args })
  }

  async append(...args) {
    return ipc.to.top.send("IPCDriver", { type: "append", args })
  }
}

export const driver = (...args) => new IPCDriver(...args).init()
