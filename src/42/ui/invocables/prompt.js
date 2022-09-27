import modal from "./modal.js"
import configure from "../../core/configure.js"

const DEFAULT = {
  label: "Prompt",
  class: "dialog-modal dialog-prompt",
  tag: "text",
  value: "",
  prose: true,
  enterKeyHint: undefined,
}

export default async function prompt(message = "", options) {
  if (message && typeof message === "object") {
    options = message
    message = options.message
  }

  if (typeof options === "string") options = { value: options }

  if (options?.tag === undefined && options?.value?.includes?.("\n")) {
    options ??= {}
    options.tag = "textarea"
  }

  const config = { ...DEFAULT, ...options }

  const onEnter = config.tag.startsWith("textarea")
    ? { enterKeyHint: "enter" }
    : { enterKeyHint: config.enterKeyHint ?? "done", on: { Enter: "{{ok()}}" } }

  config.content = {
    tag: ".box-h",
    content: [
      config.beforefield,
      configure(
        {
          tag: config.tag,
          scope: "value",
          rows: 4,
          lazy: true,
          label: message ?? "",
          prose: config.prose,
          ...config.field,
          ...onEnter,
        },
        config.field
      ),
      config.afterfield,
    ],
  }

  const res = await modal(config)

  return res.ok ? res.value : undefined
}
