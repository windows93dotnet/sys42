// @read https://www.electronjs.org/docs/latest/api/menu#examples

import Emitter from "./fabric/classes/Emitter.js"

export class IO extends Emitter {}
const io = new IO()

const createFile = async (path, options) =>
  import("./os/io/createPath.js") //
    .then((m) => m.default(path, options))

const createFolder = async (path, options) =>
  import("./os/io/createPath.js") //
    .then((m) => m.default(path, { ...options, folder: true }))

const deleteFiles = async (path) =>
  import("./os/io/deletePaths.js") //
    .then((m) => m.default(path))

const deleteFolders = async (path) =>
  import("./os/io/deletePaths.js") //
    .then((m) => m.default(path))

const launchFiles = async (...args) =>
  import("./os/io/launchFiles.js").then((m) => m.default(...args))

const launchFolders = async (...args) =>
  import("./os/io/launchFolders.js").then((m) => m.default(...args))

const renameFiles = async (...args) =>
  import("./os/io/renamePaths.js").then((m) => m.default(...args))

const renameFolders = async (...args) =>
  import("./os/io/renamePaths.js").then((m) => m.default(...args))

const movePaths = async (...args) =>
  import("./os/io/movePaths.js").then((m) => m.default(...args))

const copyPaths = async (...args) =>
  import("./os/io/copyPaths.js").then((m) => m.default(...args))

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
  { ...launchFiles.meta, click: "{{io.launchFiles(selection)}}" },
  "---",
  { ...deleteFiles.meta, click: "{{io.deleteFiles(selection)}}" },
  "---",
  { ...renameFiles.meta, click: "{{io.renameFiles(selection)}}" },
]

const folderContextMenu = [
  { ...launchFolders.meta, click: "{{io.launchFolders(selection)}}" },
  "---",
  { ...deleteFolders.meta, click: "{{io.deleteFolders(selection)}}" },
  "---",
  { ...renameFiles.meta, click: "{{io.renameFiles(selection)}}" },
]

export default Object.assign(io, {
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
