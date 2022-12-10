import { MASKS } from "./Disk.js"

import { driver as indexeddbDriver } from "./drivers/indexeddbDriver.js"
import { driver as localstorageDriver } from "./drivers/localstorageDriver.js"
import { driver as memoryDriver } from "./drivers/memoryDriver.js"

const modules = {
  indexeddb: indexeddbDriver,
  localstorage: localstorageDriver,
  memory: memoryDriver,
}

const drivers = {}

export default async function getDriver(name) {
  const type = typeof name
  if (type === "function") return name

  name = type === "number" ? MASKS[name] : name.toLowerCase()

  if (drivers[name]) return drivers[name]

  drivers[name] = await modules[name](getDriver)
  return drivers[name]
}
