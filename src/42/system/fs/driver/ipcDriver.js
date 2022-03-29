import BrowserDriver from "../BrowserDriver.js"
import ipc from "../../ipc.js"

const bus = ipc.to(globalThis.top)

class IPCDriver extends BrowserDriver {
  async open(...args) {
    return bus.send("IPCDriver", { type: "open", args })
  }

  async write(...args) {
    return bus.send("IPCDriver", { type: "write", args })
  }

  async delete(...args) {
    return bus.send("IPCDriver", { type: "delete", args })
  }

  async append(...args) {
    return bus.send("IPCDriver", { type: "append", args })
  }
}

export const driver = (...args) => new IPCDriver(...args).init()
