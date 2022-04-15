import disk from "../../system/fs/disk.js"
// import os from "../../os.js"

export default async function open(options) {
  if (typeof options === "string") options = { glob: options }
  const { glob } = options
  for (const filename of disk.glob(glob)) {
    console.log(1, filename)
  }
}
