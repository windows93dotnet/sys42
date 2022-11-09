import FileAgent from "./FileAgent.js"
import supportInstall from "../../../core/env/supportInstall.js"

const editor = {
  menubar: [
    {
      $id: "FileMenu",
      label: "File",
      content: [
        {
          $id: "newFile",
          label: "New",
          picto: "file",
          shortcut: "Ctrl+N",
          click: "{{editor.newFile(}}",
        },
        {
          $id: "openFile",
          label: "Open…",
          picto: "folder-open",
          shortcut: "Ctrl+O",
          click: "{{editor.openFile(}}",
        },
        {
          $id: "saveFile",
          label: "Save",
          picto: "save",
          shortcut: "Ctrl+S",
          click: "{{editor.saveFile()}}",
        },
        "---",
        {
          $id: "import",
          label: "Import…",
          picto: "import",
          click: "{{editor.import()}}",
        },
        {
          $id: "export",
          label: "Export…",
          picto: "export",
          click: "{{editor.export()}}",
        },
        "---",
        {
          $id: "exit",
          label: "Exit",
          click: "{{editor.exit()}}",
        },
      ],
    },
    {
      $id: "ViewMenu",
      label: "View",
      content: [
        {
          $id: "fullscreen",
          label: "Full Screen",
          click: "{{editor.fullscreen()}}",
          disabled: !document.fullscreenEnabled,
        },
        {
          $id: "openInNewTab",
          label: "Open in New Tab",
          click: "{{editor.openInNewTab()}}",
        },
      ],
    },
    {
      $id: "HelpMenu",
      label: "Help",
      content: [
        {
          $id: "install",
          label: "Install on {{editor.getOS()}} desktop",
          click: "{{editor.install()}}",
          disabled: !supportInstall,
          title: supportInstall ? undefined : "Not supported in this browser",
        },
        "---",
        {
          $id: "about",
          label: "About",
          click: "{{editor.about()}}",
        },
      ],
    },
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

    install() {
      import("../../../fabric/browser/openInNewTab.js").then(
        ({ openInNewTab }) => openInNewTab(dir + "?install")
      )
    },

    openInNewTab() {
      import("../../../fabric/browser/openInNewTab.js").then(
        ({ openInNewTab }) => openInNewTab(dir)
      )
    },

    fullscreen() {
      import("../../../fabric/browser/toggleFullscreen.js") //
        .then((m) => m.default())
    },
    about() {
      Promise.all([
        import("../../../ui/components/dialog.js") //
          .then(({ dialog }) => dialog),
        import("../../blocks/appCard.js") //
          .then((m) => m.default),
      ]).then(([dialog, appCard]) => {
        dialog({
          class: "ui-dialog-about",
          label: "About",
          content: appCard(manifest),
        })
      })
    },
    getOS() {
      return (
        navigator.userAgentData?.platform ??
        import("../../../core/env/parseUserAgent.js") //
          .then((m) => m.default().os.name)
      )
    },

    exit() {
      console.log("exit")
    },
  })
}

export default editor
