import system from "../system.js"
import truncate from "../fabric/type/string/truncate.js"

export const copy = async (text, options) => {
  await navigator.clipboard.writeText(text)
  if (options?.notif) {
    const type = typeof options.notif
    if (type === "string") {
      system.emit("notif", options.notif)
    } else {
      system.emit("notif", `copied "${truncate(text)}" to clipboard`)
    }
  }
}

export const paste = async () => navigator.clipboard.readText()

const clipboard = Object.create(null)
clipboard.copy = copy
clipboard.paste = paste

export default clipboard
