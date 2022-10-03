export default async function readDirectoryEntry(
  entry,
  { files = {}, folders = [] } = {},
  options
) {
  const reader = entry.createReader()

  const undones = []

  await new Promise((resolve, reject) => {
    reader.readEntries((entries) => {
      if (entries.length === 0 || options?.allFolders === true) {
        folders.push(entry.fullPath.slice(1) + "/")
      }

      for (const entry of entries) {
        if (entry.isDirectory) {
          undones.push(readDirectoryEntry(entry, { files, folders }))
        } else {
          undones.push(
            new Promise((resolve, reject) => {
              entry.file(resolve, reject)
            }).then((file) => {
              files[entry.fullPath.slice(1)] = file
            })
          )
        }
      }

      resolve()
    }, reject)
  })

  await Promise.all(undones)

  return { files, folders }
}
