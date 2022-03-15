import system from "../system.js"

export const copy = async (text, options) => {
  await navigator.clipboard.writeText(text)
  if (options?.notif) {
    const type = typeof options.notif
    if (type === "object") {
      options.notif.value ??= `copied "${text}" to clipboard`
      system.emit("notif", options.notif)
    } else {
      system.emit("notif", options.notif)
    }
  }
}

export const paste = async () => navigator.clipboard.readText()

const clipboard = Object.create(null)
clipboard.copy = copy
clipboard.paste = paste

export default clipboard
