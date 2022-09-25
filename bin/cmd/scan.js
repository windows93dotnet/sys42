import globby from "globby"
import cbor from "cbor"
import fs from "node:fs/promises"

import getExtname from "../../src/42/core/path/core/getExtname.js"
import system from "../../src/42/system.js"
import allocate from "../../src/42/fabric/locator/allocate.js"
import sortPath from "../../src/42/core/path/core/sortPath.js"

const task = system.config.tasks.scan

const GLOBBY_DEFAULTS = {
  gitignore: true,
  onlyFiles: true,
}

export default async function scan() {
  const cwd = system.config.paths.dirs.src
  const files = {}
  system.config.files = files

  const scannedFiles = sortPath(
    await globby(task.glob, { ...GLOBBY_DEFAULTS, cwd })
  )

  if (scannedFiles.length === 0) {
    task.log(
      `💥 {yellow could not find any files matching pattern: ${task.glob}}`
    )
    return 1
  }

  scannedFiles.forEach((file) => allocate(files, file, 0, "/"))

  if (system.config.paths.files.scan) {
    const ext = getExtname(system.config.paths.files.scan)

    let buffer
    if (ext === ".json") {
      const str = JSON.stringify(files)
      buffer = new TextEncoder().encode(str)
    } else if (ext === ".cbor") {
      buffer = cbor.encode(files)
    } else {
      throw new Error(
        `Scan file must be .json or .cbor : ${system.config.paths.files.scan}`
      )
    }

    await fs.writeFile(system.config.paths.files.scan, buffer)

    task.log(
      ` scan {white.dim →} ${task.log.format.file(
        system.config.paths.files.scan,
        { colors: { name: "bright.magenta" }, bytes: buffer.byteLength }
      )} (${scannedFiles.length} files indexed)}`
    )
  }

  // task.log.tree(files.tests)

  return 0
}
