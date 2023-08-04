import supportInstall from "../../../core/env/supportInstall.js"
import nextCycle from "../../../fabric/type/promise/nextCycle.js"
// import inPWA from "../../../core/env/runtime/inPWA.js"

const editor = {
  makeDefs(manifest) {
    return {
      transferableTabs: {
        $id: "transferableTabs",
        kind: "42_TR_APP_TAB",
        accept: "42_TR_ICON",
      },
      menubar: [
        {
          $id: "FileMenu",
          label: "File",
          items: [
            {
              $id: "newFile",
              label: "New",
              picto: "file",
              shortcut: "Alt+N",
              click: "{{editor.newFile()}}",
            },
            {
              $id: "openFile",
              label: "Open…",
              picto: "folder-open",
              shortcut: "Ctrl+O",
              click: "{{editor.openFile()}}",
            },
            // TODO: allow apps to open folders
            // {
            //   $id: "openFolder",
            //   label: "Open Folder…",
            //   picto: "folder-open",
            //   shortcut: "Ctrl+K Ctrl+O",
            //   click: "{{editor.openFolder()}}",
            // },
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
              $id: "importFile",
              label: "Import…",
              picto: "import",
              click: "{{editor.importFile()}}",
            },
            {
              $id: "exportFile",
              disabled: "{{$files.length === 0}}",
              label: "Export…",
              picto: "export",
              click: "{{editor.exportFile()}}",
            },
            ...(manifest.multiple
              ? [
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
                ]
              : []),
            // "---",
            // {
            //   $id: "exit",
            //   label: "Exit",
            //   click: "{{editor.exit()}}",
            // },
          ],
        },
        {
          $id: "ViewMenu",
          label: "View",
          items: [
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
          items: [
            {
              $id: "install",
              label: "Install on {{editor.getOS()}} desktop",
              click: "{{editor.install()}}",
              disabled: !supportInstall,
              title: supportInstall
                ? undefined
                : "Not supported in this browser",
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
  },
}

editor.init = (app) => {
  const { state, manifest } = app
  const { encode, decode, dir } = manifest

  const defaultFolder = manifest.defaultFolder ?? "$HOME/"

  async function getBlob($file, path) {
    // Allow any reactive pending updates to happen
    await nextCycle()
    await app.stage.reactive.pendingUpdate

    const [res] = await app.send("encode", $file, path)
    return res ?? $file.blob
  }

  const emptyFile = manifest.emptyFile ?? { name: "untitled" }

  const methods = {
    newFile(init) {
      if (manifest.multiple !== true) state.$files.length = 0
      const i = state.$files.push(init ?? emptyFile)
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
    async saveFile($file) {
      if (typeof $file === "number") $file = state.$files[$file]
      else $file ??= state.$files[state.$current]
      if (!$file) return

      if ($file?.path) {
        const [blob, fs] = await Promise.all([
          getBlob($file, $file.path),
          import("../../../core/fs.js") //
            .then(({ fs }) => fs),
        ])
        await fs.write($file.path, blob)
        $file.dirty = false
      } else {
        await app.run.editor.saveFileAs()
      }
    },
    async saveFileAs($file) {
      if (typeof $file === "number") $file = state.$files[$file]
      else $file ??= state.$files[state.$current]
      if (!$file) return

      const filePickerSave = await import(
        "../../../ui/invocables/filePickerSave.js"
      ).then(({ filePickerSave }) => filePickerSave)

      const { ok, path } = await filePickerSave(
        $file.path ?? defaultFolder + emptyFile.name,
      )

      if (ok) {
        const [blob, fs] = await Promise.all([
          getBlob($file, path),
          import("../../../core/fs.js") //
            .then(({ fs }) => fs),
        ])

        await fs.write(path, blob)
        $file.updatePath(path)
        $file.dirty = false
      }
    },
    async saveAll() {
      console.log("saveAll")
    },
    async exportFile() {
      const $file = state.$files[state.$current]
      if (!$file) return

      const [blob, fileExport] = await Promise.all([
        getBlob($file),
        import("../../../fabric/type/file/fileExport.js") //
          .then((m) => m.default),
      ])
      await fileExport(new File([blob], $file.name), encode)
    },

    /* open/import
    -------------- */
    async openFile() {
      await import("../../../ui/invocables/filePickerOpen.js") //
        .then(({ filePickerOpen }) =>
          filePickerOpen(
            state.$files[state.$current]?.path ?? defaultFolder, //
            { files: false },
          ),
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
    async importFile() {
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
        .then(({ toggleFullscreen }) => {
          const screen = document.querySelector(".screen")
          toggleFullscreen(screen ?? undefined)
        })
    },
    async about() {
      await Promise.all([
        import("../../../ui/components/dialog.js") //
          .then(({ dialog }) => dialog),
        import("../../blocks/appCard.js") //
          .then((m) => m.default),
      ]).then(([dialog, appCard]) => {
        dialog({
          plugins: ["markdown"],
          class: "ui-dialog-about",
          label: "About",
          content: { tag: ".pa-xl", content: appCard(manifest) },
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
  }

  app.stage.actions.assign("/editor", methods)
  Object.assign(app, methods)
}

export default editor
