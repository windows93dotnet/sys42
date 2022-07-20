// @related https://github.com/GoogleChromeLabs/browser-fs-access

// @thanks https://stackoverflow.com/a/67603015

import inOpaqueOrigin from "../../../core/env/runtime/inOpaqueOrigin.js"
const supportShowOpenFilePicker = "showOpenFilePicker" in globalThis

function legacyAccept(types) {
  if (!Array.isArray(types)) return

  const mimetypes = []
  const extensions = []
  for (const { accept } of types) {
    for (const [mimetype, extension] of Object.entries(accept)) {
      mimetypes.push(mimetype)
      extensions.push(...extension)
    }
  }

  return [...mimetypes, extensions].join(",")
}

function legacyOpenFile(options) {
  return new Promise((resolve) => {
    let input = document.createElement("input")
    input.type = "file"

    options.accept ??= legacyAccept(options.types)
    if (options.accept) input.accept = options.accept

    if (options.multiple) input.multiple = options.multiple
    if (options.directory) {
      input.webkitdirectory = true
      input.mozdirectory = true
      input.directory = true
    }

    // @read https://stackoverflow.com/questions/47664777/javascript-file-input-onchange-not-working-ios-safari-only
    input.style.position = "fixed"
    input.style.top = "-1000vh"
    input.style.left = "-1000vw"
    document.body.append(input)

    input.addEventListener(
      "change",
      () => {
        resolve([...input.files])
        input.remove()
        input = undefined
      },
      { once: true }
    )
    input.click()
  })
}

async function openFile(options = {}) {
  const handle = await globalThis.showOpenFilePicker(options)

  const files = []

  for await (const entry of handle.values()) {
    const file = await entry.getFile()
    // file.handle = handle
    files.push(file)
  }

  return files
}

export default async function fileImport(options = {}) {
  const config = {
    types: options.types,
    accept: options.accept,
    excludeAcceptAllOption: options.excludeAcceptAllOption,
    multiple: options.multiple,
    directory: options.directory,
  }

  return !inOpaqueOrigin && supportShowOpenFilePicker
    ? openFile(config)
    : legacyOpenFile(config)
}
