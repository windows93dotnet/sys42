// @read https://www.electronjs.org/docs/latest/api/menu#examples

const createFile = async (path, options) =>
  import("./actions/createPath.js") //
    .then((m) => m.default(path, options))

const createFolder = async (path, options) =>
  import("./actions/createPath.js") //
    .then((m) => m.default(path, { ...options, folder: true }))

const deleteFiles = async (path) =>
  import("./actions/deletePaths.js") //
    .then((m) => m.default(path))

const deleteFolders = async (path) =>
  import("./actions/deletePaths.js") //
    .then((m) => m.default(path))

const launchFiles = async (...args) =>
  import("./actions/launchPaths.js").then((m) => m.default(...args))

const launchFolders = async (...args) =>
  import("./actions/launchPaths.js").then((m) => m.default(...args))

const renameFiles = async (...args) =>
  import("./actions/renamePaths.js").then((m) => m.default(...args))

const renameFolders = async (...args) =>
  import("./actions/renamePaths.js").then((m) => m.default(...args))

const movePaths = async (...args) =>
  import("./actions/movePaths.js").then((m) => m.default(...args))

const copyPaths = async (...args) =>
  import("./actions/copyPaths.js").then((m) => m.default(...args))

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
  { ...launchFiles.meta, click: "{{os.launchFiles(selection)}}" },
  "---",
  { ...deleteFiles.meta, click: "{{os.deleteFiles(selection)}}" },
  "---",
  { ...renameFiles.meta, click: "{{os.renameFiles(selection)}}" },
]

const folderContextMenu = [
  { ...launchFolders.meta, click: "{{os.launchFolders(selection)}}" },
  "---",
  { ...deleteFolders.meta, click: "{{os.deleteFolders(selection)}}" },
  "---",
  { ...renameFiles.meta, click: "{{os.renameFiles(selection)}}" },
]

export default {
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
}
