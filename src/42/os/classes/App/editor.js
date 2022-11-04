const editor = {
  menuitems: {
    newFile: {
      label: "New",
      picto: "file",
      shortcut: "Ctrl+N",
      click: "{{editor.newFile(}}",
    },
    openFile: {
      label: "Open",
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
    exit: {
      label: "Exit",
      click: "{{editor.exit()}}",
    },
  },
}

editor.menuitems.File = {
  label: "File",
  content: [
    editor.menuitems.newFile,
    editor.menuitems.openFile,
    editor.menuitems.saveFile,
    "---",
    editor.menuitems.exit,
  ],
}

editor.makeActions = (state) => ({
  newFile() {
    state.$files[0] = {
      path: undefined,
      data: undefined,
      dirty: false,
    }
  },
  async saveFile() {
    console.log("saveFile", await state.$files[0].data)
  },
  openFile() {
    console.log("openFile")
  },
  exit() {
    console.log("exit")
  },
})

export default editor
