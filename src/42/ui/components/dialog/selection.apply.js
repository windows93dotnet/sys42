import fs from "../../../system/fs.js"

export async function apply(data) {
  data.files = await Promise.all(
    data.selection.map(
      (path) => fs.open(path) //
    )
  )
  return data
}
