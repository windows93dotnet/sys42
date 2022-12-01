// @read https://www.electronjs.org/docs/latest/api/menu#examples

import Emitter from "./fabric/classes/Emitter.js"

export class IO extends Emitter {}
const io = new IO()

const listenImport = async () =>
  import("./os/io/listenImport.js") //
    .then((m) => m.default(io))

const createFile = async (path, options) =>
  import("./os/io/createPath.js") //
    .then((m) => m.default(path, options))

const createFolder = async (path, options) =>
  import("./os/io/createPath.js") //
    .then((m) => m.default(path, { ...options, folder: true }))

const deleteFile = async (path) =>
  import("./os/io/deletePath.js") //
    .then((m) => m.default(path))

const deleteFolder = async (path) =>
  import("./os/io/deletePath.js") //
    .then((m) => m.default(path))

const launchFile = async (...args) =>
  import("./os/io/launchFile.js").then((m) => m.default(...args))

const launchFolder = async (...args) =>
  import("./os/io/launchFolder.js").then((m) => m.default(...args))

const renameFile = async (...args) =>
  import("./os/io/renamePath.js").then((m) => m.default(...args))

const renameFolder = async (...args) =>
  import("./os/io/renamePath.js").then((m) => m.default(...args))

const movePath = async (...args) =>
  import("./os/io/movePath.js").then((m) => m.default(...args))

createFile.meta = {
  label: "Create File…",
}

createFolder.meta = {
  label: "Create Folder…",
  shortcut: "F10",
}

deleteFile.meta = {
  label: "Delete File",
  shortcut: "Del",
}

deleteFolder.meta = {
  label: "Delete Folder",
  shortcut: "Del",
}

launchFile.meta = {
  label: "Open File…",
  shortcut: "Ctrl+O",
  picto: "file",
}

launchFolder.meta = {
  label: "Open Folder…",
  shortcut: "Ctrl+K Ctrl+O",
  picto: "folder-open",
}

renameFile.meta = {
  label: "Rename…",
  shortcut: "F2",
}

renameFolder.meta = { ...renameFile.meta }

const fileContextMenu = [
  { ...launchFile.meta, click: "{{io.launchFile(selection)}}" },
  "---",
  { ...deleteFile.meta, click: "{{io.deleteFile(selection)}}" },
  "---",
  { ...renameFile.meta, click: "{{io.renameFile(selection)}}" },
]

const folderContextMenu = [
  { ...launchFolder.meta, click: "{{io.launchFolder(selection)}}" },
  "---",
  { ...deleteFolder.meta, click: "{{io.deleteFolder(selection)}}" },
  "---",
  { ...renameFile.meta, click: "{{io.renameFile(selection)}}" },
]

export default Object.assign(io, {
  listenImport,
  createFile,
  createFolder,
  deleteFile,
  deleteFolder,
  launchFile,
  launchFolder,
  renameFile,
  renameFolder,
  movePath,

  fileContextMenu,
  folderContextMenu,
})
