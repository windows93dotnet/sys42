export default function joinScope(scope, ...keys) {
  if (keys.length === 1 && keys[0] === ".") return scope

  let out = scope

  for (const key of keys) {
    // key = key.replaceAll(".", "\\.")
    out += (out && out !== "." ? "." : "") + key
  }

  return out
}
