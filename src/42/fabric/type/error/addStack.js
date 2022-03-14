export default function addStack(err, stack, { prepend } = {}) {
  if (stack.source) stack = stack.source
  err.stack =
    prepend === true
      ? err.stack.replace(/^[^\n]*?\n/, "$&" + stack.replace(/^[^\n]*?\n/, ""))
      : stack.replace(/^[^\n]*?\n/, err.stack + "\n")
  return err
}
