import joinPath from "../../../src/42/fabric/type/path/core/joinPath.js"

export default function normalizePaths(cwd, paths) {
  const out = {}

  Object.keys(paths).forEach((type) => {
    out[type] = {}
    Object.entries(paths[type]).forEach(([key, val]) => {
      out[type][key] = val ? joinPath(cwd, val) : ""
    })
  })

  return out
}
