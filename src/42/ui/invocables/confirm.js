import modal from "./modal.js"

const DEFAULT = {
  label: "Confirm",
  class: "dialog-modal dialog-confirm",
}

export default async function confirm(message = "", options) {
  if (options === undefined && message && typeof message === "object") {
    options = message
    message = options.message
  }

  const config = { ...DEFAULT, ...options }

  config.content = {
    tag: ".box-center-y.pa-md",
    content: { tag: "div", content: message },
  }

  const res = await modal(config)

  return Boolean(res.ok)
}
