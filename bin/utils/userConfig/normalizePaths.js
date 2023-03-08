import path from "node:path"

export default function normalizePaths(cwd, paths) {
  const out = {}

  Object.keys(paths).forEach((type) => {
    out[type] = {}
    Object.entries(paths[type]).forEach(([key, val]) => {
      out[type][key] = val ? path.join(cwd, val) : ""
    })
  })

  return out
}
