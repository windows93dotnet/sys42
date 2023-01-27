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
          $id: "openFiles",
          label: "Open…",
          picto: "folder-open",
          shortcut: "Ctrl+O",
          click: "{{editor.openFiles()}}",
        },
        {
          $id: "saveFile",
          disabled: "{{$files.length === 0}}",
          label: "Save",
          picto: "save",
          shortcut: "Ctrl+S",
          click: "{{editor.saveFile()}}",
        },
        {
          $id: "saveFileAs",
          disabled: "{{$files.length === 0}}",
          label: "Save As…",
          shortcut: "Ctrl+Shift+S",
          click: "{{editor.saveFileAs()}}",
        },
        {
          $id: "saveAll",
          // disabled: "{{$files.length === 0}}",
          disabled: true,
          label: "Save All",
          click: "{{editor.saveAll()}}",
        },
        "---",
        {
          $id: "importFiles",
          label: "Import…",
          picto: "import",
          click: "{{editor.importFiles()}}",
        },
        {
          $id: "exportFile",
          disabled: "{{$files.length === 0}}",
          label: "Export…",
          picto: "export",
          click: "{{editor.exportFile()}}",
        },
        "---",
        {
          $id: "closeFile",
          disabled: "{{$files.length === 0}}",
          label: "Close",
          shortcut: "Alt+W",
          click: "{{editor.closeFile()}}",
        },
        {
          $id: "closeAll",
          disabled: "{{$files.length === 0}}",
          label: "Close All",
          click: "{{editor.closeAll()}}",
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

  const defaultFolder = manifest.defaultFolder ?? "$HOME"

  setTimeout(() => {
    state.$files.push("/tests/fixtures/formats/example.json5")
  }, 0)

  app.stage.actions.assign("/editor", {
    newFile() {
      if (manifest.multiple !== true) state.$files.length = 0
      const i = state.$files.push(manifest.emptyFile ?? { name: "untitled" })
      state.$current = i - 1
    },
    closeFile() {
      state.$files.splice(state.$current, 1)
    },
    closeAll() {
      state.$files.length = 0
    },

    /* save/export
    -------------- */
    async saveFile() {
      const i = state.$current
      const $file = state.$files[i]
      if ($file?.path) {
        const [blob, fs] = await Promise.all([
          $file.blob,
          import("../../../core/fs.js") //
            .then(({ fs }) => fs),
        ])
        await fs.write($file.path, blob)
        $file.dirty = false
      } else {
        await app.run.editor.saveFileAs()
      }
    },
    async saveFileAs() {
      const i = state.$current
      const $file = state.$files[i]
      if (!$file) return

      const [data, filePickerSave] = await Promise.all([
        $file.blob,
        import("../../../ui/invocables/filePickerSave.js") //
          .then(({ filePickerSave }) => filePickerSave),
      ])
      const { ok, path } = await filePickerSave(
        $file?.path ?? defaultFolder, //
        { data }
      )
      if (ok) {
        $file.updatePath(path)
        $file.dirty = false
      }
    },
    async saveAll() {
      console.log("saveAll")
    },
    async exportFile() {
      const i = state.$current
      const $file = state.$files[i]
      if (!$file) return

      const [blob, fileExport] = await Promise.all([
        $file.blob,
        import("../../../fabric/type/file/fileExport.js") //
          .then((m) => m.default),
      ])
      await fileExport(new File([blob], $file.name), encode)
    },

    /* open/import
    -------------- */
    async openFiles() {
      await import("../../../ui/invocables/filePickerOpen.js") //
        .then(({ filePickerOpen }) =>
          filePickerOpen(
            state.$files[state.$current]?.path ?? defaultFolder, //
            { files: false }
          )
        )
        .then(({ ok, selection }) => {
          if (ok && selection.length > 0) {
            if (manifest.multiple !== true) state.$files.length = 0

            const [first, ...rest] = selection
            const i = state.$files.push({ path: first })
            state.$current = i - 1

            if (manifest.multiple === true) {
              for (const path of rest) {
                state.$files.push({ path })
              }
            }
          }
        })
    },
    async importFiles() {
      const fileImport = await import("../../../fabric/type/file/fileImport.js") //
        .then((m) => m.default)

      if (manifest.multiple !== true) state.$files.length = 0

      const [first, ...rest] = await fileImport(decode)
      const i = state.$files.push({ file: first })
      state.$current = i - 1

      if (manifest.multiple === true) {
        for (const file of rest) {
          state.$files.push({ file })
        }
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
