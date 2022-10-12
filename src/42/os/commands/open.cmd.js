import disk from "../../core/disk.js"
import appsManager from "../managers/appsManager.js"

export default async function open(options) {
  if (typeof options === "string" || Array.isArray(options)) {
    options = { glob: options }
  }

  const { glob } = options
  appsManager.open(disk.glob(glob))
}
