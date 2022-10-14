import BrowserDriver from "../BrowserDriver.js"
import base64 from "../../formats/base64.js"

class LocalStorageDriver extends BrowserDriver {
  static store = {
    has(id) {
      return localStorage.getItem(id) !== null
    },
    async set(id, data) {
      data =
        data.type === "application/octet-stream"
          ? `42_BASE64:${base64.fromArrayBuffer(await data.arrayBuffer())}`
          : await data.text()
      localStorage.setItem(id, data)
    },
    get(id) {
      const data = localStorage.getItem(id)
      return data.startsWith("42_BASE64:")
        ? BrowserDriver.toFile([base64.toArrayBuffer(data.slice(10))])
        : BrowserDriver.toFile([data])
    },
    delete(id) {
      return localStorage.removeItem(id)
    },
  }
  static mask = 0x12
}

export const driver = (...args) => new LocalStorageDriver(...args).init()
