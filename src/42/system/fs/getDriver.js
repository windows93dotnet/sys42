import addStack from "../../fabric/type/error/addStack.js"
import fs from "../fs.js"
import { MASKS } from "./Disk.js"

import { driver as fetchDriver } from "./driver/fetchDriver.js"
import { driver as indexeddbDriver } from "./driver/indexeddbDriver.js"
import { driver as memoryDriver } from "./driver/memoryDriver.js"

const modules = {
  fetch: fetchDriver,
  indexeddb: indexeddbDriver,
  memory: memoryDriver,
}

const drivers = {}

export default async function getDriver(name, stack = "") {
  const type = typeof name
  if (type === "function") return name

  name = type === "number" ? MASKS[name] : name.toLowerCase()

  if (drivers[name]) return drivers[name]

  try {
    drivers[name] = await modules[name](fs.config, stack, getDriver)
    return drivers[name]
  } catch (err) {
    throw addStack(err, stack)
  }
}
