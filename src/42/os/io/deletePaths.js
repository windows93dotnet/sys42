import fs from "../../core/fs.js"
import arrify from "../../fabric/type/any/arrify.js"

export default async function deletePaths(selection) {
  if (!selection) return
  const out = []

  for (const path of arrify(selection)) {
    out.push(path.endsWith("/") ? fs.deleteDir(path) : fs.delete(path))
  }

  return Promise.all(out)
}
