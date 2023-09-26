import { FS_DRIVER_MASKS } from "./FileIndex.js"

import { driver as indexeddb } from "./drivers/indexeddbDriver.js"
import { driver as localstorage } from "./drivers/localstorageDriver.js"
import { driver as memory } from "./drivers/memoryDriver.js"

const modules = {
  indexeddb,
  localstorage,
  memory,
}

const drivers = {}

export default async function getDriver(name) {
  const type = typeof name
  if (type === "function") return name

  name = type === "number" ? FS_DRIVER_MASKS[name] : name.toLowerCase()

  if (drivers[name]) return drivers[name]

  drivers[name] = await modules[name](getDriver)
  return drivers[name]
}
