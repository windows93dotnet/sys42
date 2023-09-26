import { FS_DRIVER_MASKS } from "./FileIndex.js"

const drivers = {}

export default async function getDriverLazy(name) {
  const type = typeof name
  if (type === "function") return name

  name = type === "number" ? FS_DRIVER_MASKS[name] : name.toLowerCase()

  if (drivers[name]) return drivers[name]

  const { driver } = await import(`./drivers/${name}Driver.js`)
  drivers[name] = await driver(getDriverLazy)
  return drivers[name]
}
