import dialog from "../components/dialog.js"
import configure from "../../core/configure.js"

const DEFAULT = {
  label: "Prompt",
  class: "dialog-prompt",
  field: "text",
  value: "",
  prose: true,
  enterKeyHint: undefined,
}

export default async function prompt(message = "", options) {
  if (typeof message === "object") {
    options = message
    message = options.message
  }

  if (typeof options === "string") options = { value: options }

  const config = configure(DEFAULT, options)

  const onEnter =
    config.enterKeyHint ?? config.field.startsWith("textarea")
      ? { enterKeyHint: "enter", on: { Enter: "{{ok()}}" } }
      : { enterKeyHint: "done" }

  const res = await dialog({
    label: config.label,
    class: config.class,
    content: {
      tag: ".box-h._my",
      content: {
        tag: config.field,
        scope: "text",
        // lazy: true,
        label: message,
        prose: config.prose,
        ...onEnter,
      },
    },
    footer: config.footer ?? [
      { tag: "button", label: "Cancel", click: "{{close()}}" },
      { tag: "button.btn-default", label: "Ok", click: "{{ok()}}" },
    ],
    state: {
      text: config.value,
    },
  })

  return res.ok ? res.text : undefined
}
