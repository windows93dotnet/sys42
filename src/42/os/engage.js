// @read https://www.electronjs.org/docs/latest/api/menu#examples

const createFile = async (path, options) =>
  import("./engage/createPath.js") //
    .then((m) => m.default(path, options))

const createFolder = async (path, options) =>
  import("./engage/createPath.js") //
    .then((m) => m.default(path, { ...options, folder: true }))

const deleteFile = async (path) =>
  import("./engage/deletePath.js") //
    .then((m) => m.default(path))

const deleteFolder = async (path) =>
  import("./engage/deletePath.js") //
    .then((m) => m.default(path))

const openFile = async (...args) =>
  import("./engage/openFile.js").then((m) => m.default(...args))

const openFolder = async (...args) =>
  import("./engage/openFolder.js").then((m) => m.default(...args))

const renameFile = async (...args) =>
  import("./engage/renamePath.js").then((m) => m.default(...args))

const renameFolder = async (...args) =>
  import("./engage/renamePath.js").then((m) => m.default(...args))

const movePath = async (...args) =>
  import("./engage/movePath.js").then((m) => m.default(...args))

createFile.meta = {
  label: "Create File…",
}

createFolder.meta = {
  label: "Create Folder…",
  shortcut: "F10",
}

deleteFile.meta = {
  label: "Delete File…",
  shortcut: "Del",
}

deleteFolder.meta = {
  label: "Delete Folder…",
  shortcut: "Del",
}

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

export default {
  createFile,
  createFolder,
  deleteFile,
  deleteFolder,
  openFile,
  openFolder,
  renameFile,
  renameFolder,
  movePath,
}
