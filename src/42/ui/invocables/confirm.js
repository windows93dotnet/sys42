import demand from "./demand.js"

const DEFAULT = {
  label: "Confirm",
  class: "ui-dialog-demand ui-dialog-confirm",
}

export async function confirm(message = "", options) {
  if (options === undefined && message && typeof message === "object") {
    options = message
    message = options.message
  }

  const config = { ...DEFAULT, ...options }

  config.content = {
    tag: ".box-center-y.pa-md",
    content: { tag: "div", content: message },
  }

  const res = await demand(config)

  return Boolean(res.ok)
}

export default confirm
