import fileIndex from "../../core/fileIndex.js"
import appsManager from "../managers/appsManager.js"

export const cli = {
  argsKey: "glob",
}

export default async function open(options) {
  if (typeof options === "string" || Array.isArray(options)) {
    options = { glob: options }
  }

  const { glob } = options
  appsManager.open(fileIndex.glob(glob))
}
