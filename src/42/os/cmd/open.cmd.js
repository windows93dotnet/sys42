import disk from "../../system/fs/disk.js"
import apps from "../apps.js"

export default async function open(options) {
  if (typeof options === "string") options = { glob: options }
  const { glob } = options
  for (const filename of disk.glob(glob)) {
    apps.open(filename)
  }
}
