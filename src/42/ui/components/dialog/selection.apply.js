import fs from "../../../system/fs.js"

export async function apply(data) {
  data.selection = Object.fromEntries(
    await Promise.all(
      data.selection.map((path) => fs.open(path).then((file) => [path, file]))
    )
  )

  return data
}
