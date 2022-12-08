import system from "../../../../src/42/system.js"
import path from "../../../../src/42/core/path.js"
import loadJSON from "../../../../src/42/core/load/loadJSON.js"

export async function github(item) {
  const url = `https://registry.npmjs.org/${item.id}`
  const pkg = await loadJSON(url)

  const version = pkg["dist-tags"][item.version] || item.version

  if (version in pkg.versions === false) {
    throw new Error(`Package version not found: ${version}`)
  }

  const { tarball } = pkg.versions[version].dist

  const dir = path.resolve(system.config.paths.dirs.tmp)
  const { base, name } = path.parse(tarball)
  const file = path.join(dir, base)
  const cwd = path.join(dir, name)

  console.log(file, cwd)

  return item
}

export default github
