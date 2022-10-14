import BrowserDriver from "../BrowserDriver.js"

class LocalStorageDriver extends BrowserDriver {
  static store = {
    has(id) {
      return localStorage.getItem(id) !== null
    },
    async set(id, data) {
      data =
        data.type === "application/octet-stream"
          ? `1:${JSON.stringify(
              Array.from(new Uint8Array(await data.arrayBuffer()))
            )}`
          : `0:${await data.text()}`
      localStorage.setItem(id, data)
    },
    get(id) {
      const data = localStorage.getItem(id)
      const body = data.slice(2)
      return data.startsWith("0:")
        ? BrowserDriver.toFile([body])
        : BrowserDriver.toFile([new Uint8Array(JSON.parse(body))])
    },
    delete(id) {
      return localStorage.removeItem(id)
    },
  }
  static mask = 0x10
}

export const driver = (...args) => new LocalStorageDriver(...args).init()
