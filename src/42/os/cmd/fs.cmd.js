import { default as fsModule } from "../../system/fs.js"
import disk from "../../system/fs/disk.js"

export const cli = {
  subcommands: ["read", "open", "write"],
  argsKey: "glob",
}

export default async function fs(args) {
  const [key, sub] = Object.entries(args)[0]

  if (sub) {
    if (sub.filename) {
      return fsModule[key](sub.filename)
    }

    return Promise.all(
      disk.glob(sub.glob).map(
        (path) => fsModule[key](path) //
      )
    )
  }
}
