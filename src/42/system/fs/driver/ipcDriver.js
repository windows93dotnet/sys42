import BrowserDriver from "../BrowserDriver.js"

class IPCDriver extends BrowserDriver {
  static store = new Map([["index.html", new Blob(["coucou"])]])
  static mask = 0x01
}

export const driver = (...args) => new IPCDriver(...args).init()
