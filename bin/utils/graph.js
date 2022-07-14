import globbyModule from "globby"
const { globby } = globbyModule

import js from "./graph/js.js"
import extname from "../../src/42/fabric/type/path/extract/extname.js"

export default async function graph(glob, { cwd, host }) {
  const scanned = await globby(glob, {
    cwd,
    gitignore: true,
    onlyFiles: true,
  })

  const files = {}
  const globs = {}
  const externals = {}

  await Promise.all(
    scanned.map(async (f) => {
      const pathname = `/${f}`
      const filename = `${cwd}${pathname}`
      const base = host + pathname
      if (extname(f) !== ".js") return
      const dependencies = await js(filename)
      for (const dependency of dependencies) {
        const url = new URL(dependency.url, base)
        if (url.origin !== host) {
          externals[url.href] ??= new Set()
          externals[url.href].add(pathname)
          continue
        }

        const mod = url.pathname + url.search
        const arr = dependency.glob ? globs : files
        arr[mod] ??= new Set()
        arr[mod].add(pathname)
      }
    })
  )

  return {
    files,
    globs: Object.entries(globs),
    externals,
  }
}
