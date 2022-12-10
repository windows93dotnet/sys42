import BrowserDriver from "../BrowserDriver.js"

class MemoryDriver extends BrowserDriver {
  static mask = 0x10
  static store = new Map()
}

export const driver = (...args) => new MemoryDriver(...args).init()
