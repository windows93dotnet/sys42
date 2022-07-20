import BrowserDriver from "../BrowserDriver.js"

class MemoryDriver extends BrowserDriver {
  static store = new Map()
  static mask = 0x10
}

export const driver = (...args) => new MemoryDriver(...args).init()
