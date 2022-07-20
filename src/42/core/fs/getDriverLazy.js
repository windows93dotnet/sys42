import addStack from "../../fabric/type/error/addStack.js"
import fs from "../fs.js"
import { MASKS } from "./Disk.js"

const drivers = {}

export default async function getDriverLazy(name, stack = "") {
  const type = typeof name
  if (type === "function") return name

  name = type === "number" ? MASKS[name] : name.toLowerCase()

  if (drivers[name]) return drivers[name]

  try {
    const { driver } = await import(`./driver/${name}Driver.js`)
    drivers[name] = await driver(fs.config, stack, getDriverLazy)
    return drivers[name]
  } catch (err) {
    throw addStack(err, stack)
  }
}
