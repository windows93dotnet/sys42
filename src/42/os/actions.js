// @read https://www.electronjs.org/docs/latest/api/menu#examples

const createFile = async (path, options) =>
  import("./actions/createPath.js") //
    .then((m) => m.default(path, options))

const createFolder = async (path, options) =>
  import("./actions/createPath.js") //
    .then((m) => m.default(path, { ...options, folder: true }))

const deleteFile = async (path) =>
  import("./actions/deletePath.js") //
    .then((m) => m.default(path))

const deleteFolder = async (path) =>
  import("./actions/deletePath.js") //
    .then((m) => m.default(path))

const launchFile = async (...args) =>
  import("./actions/launchPath.js").then((m) => m.default(...args))

const launchFolder = async (...args) =>
  import("./actions/launchPath.js").then((m) => m.default(...args))

const renameFile = async (...args) =>
  import("./actions/renamePath.js").then((m) => m.default(...args))

const renameFolder = async (...args) =>
  import("./actions/renamePath.js").then((m) => m.default(...args))

const movePath = async (...args) =>
  import("./actions/movePath.js").then((m) => m.default(...args))

const copyPath = async (...args) =>
  import("./actions/copyPath.js").then((m) => m.default(...args))

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
  picto: "file",
}

launchFolder.meta = {
  label: "Open Folder…",
  picto: "folder-open",
}

renameFile.meta = {
  label: "Rename…",
  shortcut: "F2",
}

renameFolder.meta = { ...renameFile.meta }

const fileContextMenu = [
  { ...launchFile.meta, click: "{{os.launchFile(selection)}}" },
  {
    label: "Open With",
    async items(stage) {
      const { appsManager } = await import("./managers/appsManager.js")
      const apps = await appsManager.makeMenu(stage.get("selection"))
      return [
        ...apps,
        // "---",
        // {
        //   label: "Other Application…",
        //   async click() {
        //     const { dialog } = await import("../ui/components/dialog.js")
        //     const apps = await appsManager.makeMenu({ mimetype: "*" })
        //     dialog({
        //       label: "Other Application",
        //       content: {
        //         tag: "ui-menu.inset",
        //         items: apps,
        //       },
        //     })
        //   },
        // },
      ]
    },
  },
  "---",
  { ...deleteFile.meta, click: "{{os.deleteFile(selection)}}" },
  "---",
  { ...renameFile.meta, click: "{{os.renameFile(selection)}}" },
]

const folderContextMenu = [
  { ...launchFolder.meta, click: "{{os.launchFolder(selection)}}" },
  "---",
  { ...deleteFolder.meta, click: "{{os.deleteFolder(selection)}}" },
  "---",
  { ...renameFile.meta, click: "{{os.renameFile(selection)}}" },
]

export default {
  createFile,
  createFolder,
  deleteFile,
  deleteFolder,
  launchFile,
  launchFolder,
  renameFile,
  renameFolder,
  movePath,
  copyPath,

  fileContextMenu,
  folderContextMenu,
}
