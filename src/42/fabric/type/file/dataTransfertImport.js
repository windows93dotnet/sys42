const TYPE_STANDARD = {
  "application/x-javascript": "text/javascript",
}

async function normalizeDataTransferItem(item, options) {
  const { kind, type } = item

  const out = {
    kind,
    type: TYPE_STANDARD[type] ?? type,
  }

  if (kind === "file") {
    out.file = item.getAsFile?.() || undefined
    out.entry = item.getAsEntry?.() || item.webkitGetAsEntry?.() || undefined

    if (out.entry) {
      if (out.entry?.isDirectory) out.kind = "directory"
      if (options?.handle) {
        out.handle = (await item.getAsFileSystemHandle?.()) || undefined
      }
    }
  } else if (kind === "string") {
    out.string = await new Promise((resolve) =>
      item.getAsString((text) => resolve(text))
    )

    try {
      out.object = JSON.parse(out.string)
    } catch {}
  }

  return out
}

async function readDirectoryEntry(item, out = {}) {
  const reader = item.createReader()

  const undones = []

  await new Promise((resolve, reject) => {
    reader.readEntries((entries) => {
      if (entries.length === 0) {
        out[item.fullPath + "/"] = true
      } else {
        for (const entry of entries) {
          if (entry.isDirectory) {
            undones.push(readDirectoryEntry(entry, out))
          } else {
            undones.push(
              new Promise((resolve, reject) => {
                entry.file(resolve, reject)
              }).then((file) => {
                out[entry.fullPath] = file
              })
            )
          }
        }
      }

      resolve()
    }, reject)
  })

  await Promise.all(undones)

  return out
}

export default async function dataTransfertImport(dataTransfer, options) {
  if (dataTransfer?.dataTransfer) dataTransfer = dataTransfer.dataTransfer

  const out = {
    files: {},
    strings: [],
    objects: [],
    // items: [],
    paths: undefined,
  }

  const undones = []

  for (const item of dataTransfer.items) {
    // out.items.push(`${item.kind}:${item.type}`)
    undones.push(
      normalizeDataTransferItem(item, options).then(async (item) => {
        if (item.kind === "string") {
          if (
            item.string?.startsWith('{"DT_PATHS_42') &&
            item.object.DT_PATHS_42 === navigator.userAgent
          ) {
            out.paths = item.object.paths
          } else if (item.object) {
            out.objects.push(item.object)
          } else {
            out.strings.push(item.string)
          }
        } else if (item.kind === "file") {
          out.files["/" + item.file.name] = item.file
        } else if (item.kind === "directory") {
          Object.assign(out.files, await readDirectoryEntry(item.entry))
        }
      })
    )
  }

  await Promise.all(undones)

  return out
}
