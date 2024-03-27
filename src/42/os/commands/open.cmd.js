import fileIndex from "../../core/fileIndex.js"
import appsManager from "../managers/appsManager.js"

export const cli = {
  argsKey: "glob",
}

export async function open(options) {
  if (typeof options === "string" || Array.isArray(options)) {
    options = { glob: options }
  }

  const { glob, ...config } = options
  const paths = fileIndex.glob(glob)

  appsManager.open(paths, config)
}

export default open
