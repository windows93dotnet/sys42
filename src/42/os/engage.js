import fs from "../core/fs.js"
import prompt from "../ui/invocables/prompt.js"
import queueTask from "../fabric/type/function/queueTask.js"
import normalizeDirname from "../fabric/type/path/normalizeDirname.js"
import resolvePath from "../fabric/type/path/core/resolvePath.js"
import tokenizePath from "../fabric/type/path/tokenizePath.js"

// function sanitizeName(path) {
//   assertPath(path)
//   return path.replaceAll("/", "_")
// }

export async function createFolder(path) {
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

export async function rename(icon) {
  const name = await prompt("Rename", { value: icon.path })
  console.log("rename", name)
}

export default {
  createFolder,
  rename,
}
