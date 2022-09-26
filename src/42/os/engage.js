import queueTask from "../fabric/type/function/queueTask.js"
import normalizeDirname from "../core/path/utils/normalizeDirname.js"
import resolvePath from "../core/path/core/resolvePath.js"
import tokenizePath from "../core/path/utils/tokenizePath.js"

// function sanitizeName(path) {
//   assertPath(path)
//   return path.replaceAll("/", "_")
// }

export async function openFolder(path) {
  const explorer = await import("../ui/components/explorer.js") //
    .then((m) => m.default)
  return explorer(path)
}

export async function openFile(path) {
  const open = await import("./cmd/open.cmd.js") //
    .then((m) => m.default)
  return open(path)
}

export async function createFolder(path) {
  const fs = await import("../core/fs.js") //
    .then((m) => m.default)
  const prompt = await import("../ui/invocables/prompt.js") //
    .then((m) => m.default)

  let name = await prompt("Enter the name", {
    value: "New Folder",
    dialog: {
      state: { message: "" },
    },
    afterfield: {
      tag: ".message.info.txt-pre.my-sm",
      content: "{{message}}",
    },
    field: {
      on: {
        input({ target }) {
          this.state.message = target.value.includes("/")
            ? "Using slashes in folder names\nwill create sub-folders"
            : ""
        },
      },
    },
  })

  if (name) {
    path = normalizeDirname(resolvePath(path))
    name = resolvePath(name)
    const filename = path + name
    const write = await fs.writeDir(filename)

    queueTask(() => {
      const sel = `ui-icon[path^="${path + tokenizePath(name).at(0)}"]`
      const el = document.querySelector(sel)
      el?.focus()
      // el?.click()
    })

    return { write, path, name }
  }
}

export async function renameFile(icon) {
  // const fs = await import("../core/fs.js") //
  //   .then((m) => m.default)
  const prompt = await import("../ui/invocables/prompt.js") //
    .then((m) => m.default)

  const name = await prompt("Rename", { value: icon.path })
  console.log("rename", name)
}

export default {
  openFolder,
  openFile,
  createFolder,
  renameFile,
}
