import BrowserDriver from "../BrowserDriver.js"
import Database from "../../db/Database.js"

const db = new Database("fs")

class IndexedDBDriver extends BrowserDriver {
  static mask = 0x13
  static store = db.store
}

export const driver = (...args) => new IndexedDBDriver(...args).init()
