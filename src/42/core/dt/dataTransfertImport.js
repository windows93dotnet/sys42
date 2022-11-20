import readDirectoryEntry from "../../fabric/type/file/readDirectoryEntry.js"
import { handleEffect } from "./dataTransferEffects.js"

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

export default async function dataTransfertImport(e, options) {
  const dataTransfer = e?.clipboardData ?? e?.dataTransfer

  if (!(dataTransfer instanceof DataTransfer)) {
    throw new TypeError(`dataTransfer argument must be a DataTransfer instance`)
  }

  handleEffect(e, options)

  const out = {
    files: {},
    folders: [],
    strings: [],
    objects: [],
    items: [],
    paths: undefined,
    data: undefined,
    effect: dataTransfer.dropEffect,
  }

  const undones = []

  for (const item of dataTransfer.items) {
    out.items.push(`${item.kind}:${item.type}`)
    undones.push(
      normalizeDataTransferItem(item, options).then(async (item) => {
        if (item.kind === "string") {
          if (
            item.string?.startsWith('{"DT_PATHS_42') &&
            item.object.DT_PATHS_42 === navigator.userAgent
          ) {
            out.paths = item.object.paths
          } else if (item.string?.startsWith('{"DT_DATA_42')) {
            out.data = item.object.DT_DATA_42
          } else if (item.object) {
            out.objects.push(item.object)
          } else {
            out.strings.push(item.string)
          }
        } else if (item.kind === "file") {
          out.files[item.file.name] = item.file
        } else if (item.kind === "directory") {
          await readDirectoryEntry(item.entry, out)
        }
      })
    )
  }

  await Promise.all(undones)

  return out
}
