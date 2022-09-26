import queueTask from "../fabric/type/function/queueTask.js"
import resolvePath from "../core/path/core/resolvePath.js"
import tokenizePath from "../core/path/utils/tokenizePath.js"
import getBasename from "../core/path/core/getBasename.js"
import getDirname from "../core/path/core/getDirname.js"

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

export async function createFolder(path, options) {
  const fs = await import("../core/fs.js") //
    .then((m) => m.default)
  const prompt = await import("../ui/invocables/prompt.js") //
    .then((m) => m.default)

  path = resolvePath(path)

  let value
  if (path.endsWith("/")) {
    value = options?.untitled ?? "untitled"
  } else {
    value = getBasename(path)
    path = getDirname(path) + "/"
  }

  let name = await prompt("Enter the name", {
    value,
    afterfield: {
      tag: ".message.my-sm",
      role: "status",
      aria: { live: "polite" },
      content: "{{message}}",
    },
    field: {
      on: {
        async input({ target }) {
          if (target.value.includes("/")) {
            this.state.message =
              "Using slashes in folder names\nwill create sub-folders"
            await this.reactive.pendingUpdate
            target.nextElementSibling.setAttribute("aria-live", "off")
          } else if (this.state.message) this.state.message = ""
        },
      },
    },
  })

  if (name) {
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
