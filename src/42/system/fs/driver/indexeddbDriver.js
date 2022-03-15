import BrowserDriver from "../BrowserDriver.js"
import Database from "../../db/Database.js"

const db = new Database("💽 - File System", { stores: { files: {} } })

class IndexedDBDriver extends BrowserDriver {
  static store = db.files
  static mask = 0x13
}

export const driver = (...args) => new IndexedDBDriver(...args).init()
