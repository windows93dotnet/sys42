import disk from "../../core/fs/disk.js"
import apps from "../apps.js"

export default async function open(options) {
  if (typeof options === "string" || Array.isArray(options)) {
    options = { glob: options }
  }

  const { glob } = options
  apps.open(disk.glob(glob))
}
