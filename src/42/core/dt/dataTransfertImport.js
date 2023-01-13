import readDirectoryEntry from "../../fabric/type/file/readDirectoryEntry.js"
import { handleEffect } from "./dataTransferEffects.js"

const TYPE_STANDARD = {
  "application/x-javascript": "text/javascript",
}

function normalizeDataTransferItem(item, dataTransfer) {
  const { kind, type } = item

  const out = {
    kind,
    type: TYPE_STANDARD[type] ?? type,
  }

  if (kind === "file") {
    out.file = item.getAsFile?.() || undefined
    out.entry = item.getAsEntry?.() || item.webkitGetAsEntry?.() || undefined
    if (out.entry?.isDirectory) out.kind = "directory"
  } else if (kind === "string") {
    out.string = dataTransfer.getData(type)
    if (type.endsWith("json")) {
      try {
        out.object = JSON.parse(out.string)
      } catch {}
    }
  }

  return out
}

export default function dataTransfertImport(e, options) {
  const dataTransfer = e?.clipboardData ?? e?.dataTransfer
  e.preventDefault()

  if (!(dataTransfer instanceof DataTransfer)) {
    throw new TypeError(`dataTransfer argument must be a DataTransfer instance`)
  }

  handleEffect(e, options)

  const out = {
    files: {},
    folders: [],
    strings: [],
    objects: [],
    paths: undefined,
    data: undefined,
    effect: dataTransfer.dropEffect,

    undones: [],
    then(resolve, reject) {
      Promise.all(out.undones).then(() => {
        out.undones.length = 0
        delete out.undones
        delete out.then
        resolve(out)
      }, reject)
    },
  }

  for (const dataItem of dataTransfer.items) {
    const item = normalizeDataTransferItem(dataItem, dataTransfer)
    if (item.kind === "string") {
      if (
        item.type === "application/42-paths+json" &&
        item.object.userAgent === navigator.userAgent
      ) {
        out.paths = item.object.paths
      } else if (item.type === "application/json") {
        out.data = item.object
      } else if (item.object) {
        out.objects.push(item.object)
      } else {
        out.strings.push(item.string)
      }
    } else if (item.kind === "file") {
      out.files[item.file.name] = item.file
    } else if (item.kind === "directory") {
      out.undones.push(readDirectoryEntry(item.entry, out))
    }

    if (
      options?.fileSystemHandle &&
      item.entry &&
      "getAsFileSystemHandle" in dataItem
    ) {
      out.undones.push(
        item.getAsFileSystemHandle().then((res) => {
          out.fileSystemHandle = res
        })
      )
    }
  }

  return out
}
