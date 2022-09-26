// @read https://www.electronjs.org/docs/latest/api/menu#examples

const createFolder = async (...args) =>
  import("./engage/createFolder.js").then((m) => m.default(...args))

const openFile = async (...args) =>
  import("./engage/openFile.js").then((m) => m.default(...args))

const openFolder = async (...args) =>
  import("./engage/openFolder.js").then((m) => m.default(...args))

const renameFile = async (...args) =>
  import("./engage/renameFile.js").then((m) => m.default(...args))

const renameFolder = async (...args) =>
  import("./engage/renameFile.js").then((m) => m.default(...args))

openFile.meta = {
  label: "Open File…",
  shortcut: "Ctrl+O",
  picto: "file",
}

openFolder.meta = {
  label: "Open Folder…",
  shortcut: "Ctrl+K Ctrl+O",
  picto: "folder-open",
}

renameFile.meta = {
  label: "Rename…",
  shortcut: "F2",
}

renameFolder.meta = { ...renameFile.meta }

createFolder.meta = {
  label: "Create Folder…",
}

export default {
  createFolder,
  openFile,
  openFolder,
  renameFile,
  renameFolder,
}
