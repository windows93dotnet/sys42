import dialog from "../components/dialog.js"

export default async function prompt(message = "", options = {}) {
  if (typeof message === "object") {
    options = message
    message = options.message
  }

  if (typeof options === "string") options = { value: options }

  const res = await dialog({
    label: options.label ?? "Prompt",
    class: "ui-prompt" + (options.class ? ` ${options.class}` : ""),
    content: {
      tag: ".box-h._my",
      content: {
        tag: options.field ?? "input",
        scope: "text",
        label: message,
        enterKeyHint: options.field?.startsWith("textarea") ? "enter" : "done",
      },
    },
    footer: options.footer ?? [
      { tag: "button", label: "Cancel", click: "{{close()}}" },
      { tag: "button.btn-default", label: "Ok", click: "{{ok()}}" },
    ],
    state: {
      text: options.value ?? "",
    },
  })

  return res.ok ? res.text : undefined
}
