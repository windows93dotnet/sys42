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
        {
          $id: "saveFileAs",
          label: "Save As…",
          picto: "save",
          shortcut: "Ctrl+Shift+S",
          click: "{{editor.saveFileAs()}}",
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
      FileAgent.recycle(state.$files, 0, { id, file })
    })
    io.on("paths", ([path]) => {
      FileAgent.recycle(state.$files, 0, path)
    })
  })

  const defaultFolder = manifest.defaultFolder ?? "/users/anonymous/" // "$HOME"

  // setTimeout(() => {
  //   FileAgent.recycle(state.$files, 0, "/style.css")
  // }, 100)

  app.stage.actions.assign("/editor", {
    newFile() {
      FileAgent.recycle(state.$files, 0, { path: undefined, dirty: false })
    },

    /* save/export
    -------------- */
    async saveFile() {
      if (state.$files[0]?.path) {
        const [blob, fs] = await Promise.all([
          state.$files[0].blob,
          import("../../../core/fs.js") //
            .then(({ fs }) => fs),
        ])
        await fs.write(state.$files[0].path, blob)
        state.$files[0].dirty = false
      } else {
        await app.run.editor.saveFileAs()
      }
    },
    async saveFileAs() {
      if (!state.$files[0]) return

      FileAgent.recycle(state.$files, 0) // Ensure modified data are stored in a FileAgent

      const [data, filePickerSave] = await Promise.all([
        state.$files[0].blob,
        import("../../../ui/invocables/filePickerSave.js") //
          .then(({ filePickerSave }) => filePickerSave),
      ])
      const { ok, path } = await filePickerSave(
        state.$files[0]?.path ?? defaultFolder,
        { data }
      )
      if (ok) {
        state.$files[0].updatePath(path)
        state.$files[0].dirty = false
      }
    },
    async export() {
      if (!state.$files[0]) return
      const [blob, fileExport] = await Promise.all([
        state.$files[0].blob,
        import("../../../fabric/type/file/fileExport.js") //
          .then((m) => m.default),
      ])
      await fileExport(new File([blob], state.$files[0].name), encode)
    },

    /* open/import
    -------------- */
    async openFile() {
      await import("../../../ui/invocables/filePickerOpen.js") //
        .then(({ filePickerOpen }) =>
          filePickerOpen(state.$files[0]?.path ?? defaultFolder, {
            files: false,
          })
        )
        .then(({ ok, selection }) => {
          if (ok && selection.length > 0) {
            FileAgent.recycle(state.$files, 0, selection[0])
          }
        })
    },
    async import() {
      const fileImport = await import("../../../fabric/type/file/fileImport.js") //
        .then((m) => m.default)
      const [file] = await fileImport(decode)
      if (file) {
        FileAgent.recycle(state.$files, 0, { file, path: undefined })
      }
    },

    async install() {
      await import("../../../fabric/browser/openInNewTab.js") //
        .then(({ openInNewTab }) => openInNewTab(dir + "?install"))
    },
    async openInNewTab() {
      await import("../../../fabric/browser/openInNewTab.js") //
        .then(({ openInNewTab }) => openInNewTab(dir))
    },

    async fullscreen() {
      await import("../../../fabric/browser/toggleFullscreen.js") //
        .then((m) => m.default())
    },
    async about() {
      await Promise.all([
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

    async getOS() {
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
