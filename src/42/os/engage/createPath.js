import queueTask from "../../fabric/type/function/queueTask.js"
import resolvePath from "../../core/path/core/resolvePath.js"
import tokenizePath from "../../core/path/utils/tokenizePath.js"
import getBasename from "../../core/path/core/getBasename.js"
import getDirname from "../../core/path/core/getDirname.js"
import prompt from "../../ui/invocables/prompt.js"
import postfixPath from "../../core/path/core/postfixPath.js"
import disk from "../../core/disk.js"

export default async function createPath(path = "/", options) {
  let value
  if (path.endsWith("/")) {
    value = options?.untitled ?? options?.folder ? "untitled" : "untitled.txt"
  } else {
    value = getBasename(path)
    path = getDirname(path)
  }

  path = resolvePath(path) + "/"

  let cnt = 1
  const unpostfixed = value
  while (disk.has(path + value)) {
    value = postfixPath(unpostfixed, `-${++cnt}`)
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
              "Using slashes in name\nwill create sub-folders"
            await this.reactive.pendingUpdate
            target.nextElementSibling.setAttribute("aria-live", "off")
          } else if (this.state.message) this.state.message = ""
        },
      },
    },
  })

  if (name) {
    const fs = await import("../../core/fs.js") //
      .then((m) => m.default)

    name = resolvePath(name)
    const filename = path + name

    const write = options?.folder
      ? await fs.writeDir(filename)
      : await fs.writeText(filename, "")

    queueTask(() => {
      const sel = `ui-icon[path^="${path + tokenizePath(name).at(0)}"]`
      const el = document.querySelector(sel)
      el?.focus()
      // el?.click()
    })

    return { write, path, name }
  }
}
