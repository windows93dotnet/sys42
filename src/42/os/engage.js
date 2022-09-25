import fs from "../core/fs.js"
import prompt from "../ui/invocables/prompt.js"
import assertPath from "../fabric/type/path/assertPath.js"

function sanitizeDirname(path) {
  assertPath(path)
  return path.endsWith("/") ? path : `${path}/`
}

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
    path = sanitizeDirname(path)
    name = assertPath(name)
    return fs.writeDir(path + name)
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
