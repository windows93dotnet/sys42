import BrowserDriver from "../BrowserDriver.js"
import http from "../../../http.js"

class FetchDriver extends BrowserDriver {
  static mask = 0x00

  async open(filename) {
    const res = await http.get(filename)
    return res.blob()
  }

  async write() {
    console.warn("FetchDriver.write() is not possible")
  }

  async delete() {
    console.warn("FetchDriver.delete() is not possible")
  }

  async append() {
    console.warn("FetchDriver.append() is not possible")
  }
}

export const driver = (...args) => new FetchDriver(...args).init()
