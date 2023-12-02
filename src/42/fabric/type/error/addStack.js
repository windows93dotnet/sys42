export default function addStack(err, stack, { prepend } = {}) {
  if (stack.stack) stack = stack.stack
  if (stack.source) stack = stack.source
  if (typeof stack !== "string") return err
  const prefix = err.stack ?? String(err)
  err.stack =
    prepend === true
      ? prefix.replace(
          /^[^\n]*?\n/,
          "$&" + stack.replace(/^[^\n]*?\n/, "").trim() + "\n",
        )
      : stack.replace(/^[^\n]*?\n/, prefix + "\n")
  return err
}
