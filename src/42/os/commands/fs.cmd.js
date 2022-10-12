import { default as fsModule } from "../../core/fs.js"
import disk from "../../core/disk.js"

export const cli = {
  subcommands: ["read", "open", "write"],
  argsKey: "glob",
}

export default async function fs(args) {
  const [cmd, options] = Object.entries(args)[0]

  if (options) {
    if (options.filename) {
      return fsModule[cmd](options.filename)
    }

    return Promise.all(
      disk.glob(options.glob).map(
        (path) => fsModule[cmd](path) //
      )
    )
  }
}
