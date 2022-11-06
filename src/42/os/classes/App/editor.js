import FileAgent from "./FileAgent.js"

const editor = {
  menuitems: {
    newFile: {
      label: "New",
      picto: "file",
      shortcut: "Ctrl+N",
      click: "{{editor.newFile(}}",
    },
    openFile: {
      label: "Open…",
      picto: "folder-open",
      shortcut: "Ctrl+O",
      click: "{{editor.openFile(}}",
    },
    saveFile: {
      label: "Save",
      picto: "save",
      shortcut: "Ctrl+S",
      click: "{{editor.saveFile()}}",
    },

    import: {
      label: "Import…",
      picto: "import",
      id: "import",
      click: "{{editor.import()}}",
    },
    export: {
      label: "Export…",
      picto: "export",
      id: "export",
      click: "{{editor.export()}}",
    },

    fullscreen: {
      label: "Fullscreen",
      click: "{{editor.fullscreen()}}",
      disabled: !document.fullscreenEnabled,
    },
    exit: {
      label: "Exit",
      click: "{{editor.exit()}}",
    },
  },
}

editor.menuitems.FileMenu = {
  label: "File",
  content: [
    editor.menuitems.newFile,
    editor.menuitems.openFile,
    editor.menuitems.saveFile,
    "---",
    editor.menuitems.import,
    editor.menuitems.export,
    "---",
    editor.menuitems.fullscreen,
    editor.menuitems.exit,
  ],
}

editor.init = (app) => {
  const { state, manifest } = app
  const { encode, decode, dir } = manifest

  import("../../../io.js").then(({ default: io }) => {
    io.listenImport()
    io.on("import", ([{ id, file }]) => {
      const init = { id, path: file.name, data: file }
      FileAgent.recycle(state.$files, 0, init, manifest)
    })
    io.on("paths", ([path]) => {
      FileAgent.recycle(state.$files, 0, path, manifest)
    })
  })

  app.ctx.actions.assign("/editor", {
    newFile() {
      FileAgent.recycle(state.$files, 0, undefined, manifest)
    },
    async saveFile() {
      console.log("saveFile", await state.$files[0].data)
    },
    openFile() {
      console.log("openFile")
    },

    async import() {
      const fileImport = await import("../../../fabric/type/file/fileImport.js") //
        .then((m) => m.default)
      const [file] = await fileImport(decode)
      if (file) {
        FileAgent.recycle(state.$files, 0, file, manifest)
      }
    },

    async export() {
      if (!state.$files[0]) return
      const [data, getBasename, fileExport] = await Promise.all([
        state.$files[0].data,
        import("../../../core/path/core/getBasename.js") //
          .then((m) => m.default),
        import("../../../fabric/type/file/fileExport.js") //
          .then((m) => m.default),
      ])
      await fileExport(
        new File([data], getBasename(state.$files[0].path)),
        encode
      )
    },

    async install() {
      const openInNewTab = await import(
        "../../../fabric/browser/openInNewTab.js"
      ).then((m) => m.default)
      openInNewTab(dir + "?install")
    },

    fullscreen() {
      import("../../../fabric/browser/toggleFullscreen.js") //
        .then((m) => m.default())
    },

    exit() {
      console.log("exit")
    },
  })
}

export default editor
