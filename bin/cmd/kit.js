import globby from "globby"
import fs from "node:fs/promises"
import path from "node:path"

import system from "../../src/42/system.js"
import sortPath from "../../src/42/core/path/core/sortPath.js"
import tarPackPipe from "../../src/42/core/formats/tar/tarPackPipe.js"

const task = system.config.tasks.kit

const GLOBBY_DEFAULTS = {
  gitignore: true,
  onlyFiles: true,
}

const version = "0.0.0"

export default async function kit() {
  if (!system.config.paths.dirs.kits) return 0

  const cwd = system.config.paths.dirs.src

  task.glob.push(
    `!${system.config.paths.dirs.kits.replace(cwd + "/", "")}/**`,
    `!${system.config.paths.files.scan.replace(cwd + "/", "")}`,
    "!42.sw.js",
  )

  const scannedFiles = sortPath(
    await globby(task.glob, {
      ...GLOBBY_DEFAULTS,
      cwd,
      dot: true,
      absolute: true,
    }),
  )

  if (scannedFiles.length === 0) {
    task.log(
      `💥 {yellow could not find any files matching pattern: ${task.glob}}`,
    )
    return 1
  }

  const dest = path.join(system.config.paths.dirs.kits, `${version}.tar.gz`)
  const destDir = path.dirname(dest)

  try {
    await fs.access(destDir)
  } catch {
    await fs.mkdir(destDir)
  }

  const destHandle = await fs.open(dest, "w")
  const writer = destHandle.createWriteStream()

  const pack = tarPackPipe({ gzip: true })

  const undones = []

  for (const filename of scannedFiles) {
    undones.push(
      (async () => {
        const { size } = await fs.stat(filename)
        if (size >= task.maxSize) return
        const fh = await fs.open(filename)
        const header = {
          name: filename.replace(cwd + "/", ""),
          file: fh.readableWebStream(),
          size,
        }

        pack.add(header)
        return fh
      })(),
    )
  }

  const handlers = await Promise.all(undones)

  for await (const chunk of pack.stream()) {
    await writer.write(chunk)
  }

  writer.close()
  destHandle.close()

  for (const fh of handlers) fh.close()

  task.log(
    ` kit {white.dim →} ${task.log.format.file(dest, {
      colors: { name: "bright.red" },
      bytes: (await destHandle.stat()).size,
    })} (${scannedFiles.length} files bundled)`,
  )

  return 0
}
