// @read https://www.electronjs.org/docs/latest/api/menu#examples

const run = {}

const createFile = async (path, options) =>
  import("./os/runners/createPath.js") //
    .then((m) => m.default(path, options))

const createFolder = async (path, options) =>
  import("./os/runners/createPath.js") //
    .then((m) => m.default(path, { ...options, folder: true }))

const deleteFiles = async (path) =>
  import("./os/runners/deletePaths.js") //
    .then((m) => m.default(path))

const deleteFolders = async (path) =>
  import("./os/runners/deletePaths.js") //
    .then((m) => m.default(path))

const launchFiles = async (...args) =>
  import("./os/runners/launchPaths.js").then((m) => m.default(...args))

const launchFolders = async (...args) =>
  import("./os/runners/launchPaths.js").then((m) => m.default(...args))

const renameFiles = async (...args) =>
  import("./os/runners/renamePaths.js").then((m) => m.default(...args))

const renameFolders = async (...args) =>
  import("./os/runners/renamePaths.js").then((m) => m.default(...args))

const movePaths = async (...args) =>
  import("./os/runners/movePaths.js").then((m) => m.default(...args))

const copyPaths = async (...args) =>
  import("./os/runners/copyPaths.js").then((m) => m.default(...args))

createFile.meta = {
  label: "Create File…",
}

createFolder.meta = {
  label: "Create Folder…",
  shortcut: "F10",
}

deleteFiles.meta = {
  label: "Delete File",
  shortcut: "Del",
}

deleteFolders.meta = {
  label: "Delete Folder",
  shortcut: "Del",
}

launchFiles.meta = {
  label: "Open File…",
  shortcut: "Ctrl+O",
  picto: "file",
}

launchFolders.meta = {
  label: "Open Folder…",
  shortcut: "Ctrl+K Ctrl+O",
  picto: "folder-open",
}

renameFiles.meta = {
  label: "Rename…",
  shortcut: "F2",
}

renameFolders.meta = { ...renameFiles.meta }

const fileContextMenu = [
  { ...launchFiles.meta, click: "{{run.launchFiles(selection)}}" },
  "---",
  { ...deleteFiles.meta, click: "{{run.deleteFiles(selection)}}" },
  "---",
  { ...renameFiles.meta, click: "{{run.renameFiles(selection)}}" },
]

const folderContextMenu = [
  { ...launchFolders.meta, click: "{{run.launchFolders(selection)}}" },
  "---",
  { ...deleteFolders.meta, click: "{{run.deleteFolders(selection)}}" },
  "---",
  { ...renameFiles.meta, click: "{{run.renameFiles(selection)}}" },
]

export default Object.assign(run, {
  createFile,
  createFolder,
  deleteFiles,
  deleteFolders,
  launchFiles,
  launchFolders,
  renameFiles,
  renameFolders,
  movePaths,
  copyPaths,

  fileContextMenu,
  folderContextMenu,
})
