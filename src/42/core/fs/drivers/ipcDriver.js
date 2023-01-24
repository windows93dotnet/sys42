import BrowserDriver from "../BrowserDriver.js"
import ipc from "../../ipc.js"

class IPCDriver extends BrowserDriver {}

const ignore = new Set(["constructor", "init"])

for (const key of Reflect.ownKeys(BrowserDriver.prototype)) {
  if (ignore.has(key)) continue
  IPCDriver.prototype[key] = async (...args) =>
    ipc.send("IPCDriver", { type: key, args })
}

export const driver = (...args) => new IPCDriver(...args).init()
