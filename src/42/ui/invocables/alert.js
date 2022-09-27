import modal from "./modal.js"

const DEFAULT = {
  label: "Alert",
  class: "dialog-modal dialog-alert",
  decline: false,
}

export default async function alert(message = "", options) {
  if (message && typeof message === "object") {
    options = message
    message = options.message
  }

  const config = { ...DEFAULT, ...options }

  config.content = {
    tag: ".box-center-y.pa-md",
    content: { tag: "div", content: message },
  }

  const res = await modal(config)

  return res.ok
}
