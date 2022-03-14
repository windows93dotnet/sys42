export default function joinScope(scope, ...keys) {
  let out = scope

  for (const key of keys) {
    // key = key.replaceAll(".", "\\.")
    out += (out && out !== "." ? "." : "") + key
  }

  return out
}
