// @read https://github.com/jimmywarting/native-file-system-adapter/blob/master/src/adapters/downloader.js

import inOpaqueOrigin from "../../../core/env/realm/inOpaqueOrigin.js"
const supportShowSaveFilePicker = "showSaveFilePicker" in globalThis

function legacySaveFile(file, options) {
  const link = document.createElement("a")
  link.download = options.suggestedName
  link.href = URL.createObjectURL(file)
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), options.timeout ?? 10_000)
}

async function saveFile(file, options) {
  const handle = await globalThis.showSaveFilePicker(options)
  const writable = await handle.createWritable()
  return file.stream().pipeTo(writable)
}

export default async function fileExport(file, options = {}) {
  options.suggestedName ??= options.name ?? file.name ?? "untitled"

  return !inOpaqueOrigin && supportShowSaveFilePicker
    ? saveFile(file, options)
    : legacySaveFile(file, options)
}
