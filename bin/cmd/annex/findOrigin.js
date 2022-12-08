import resolvePath from "../../../src/42/core/path/core/resolvePath.js"

export default function findOrigin(id, version) {
  const lastIndexOf = id.lastIndexOf("@")
  if (lastIndexOf > 0) {
    version = id.slice(lastIndexOf + 1)
    id = id.slice(0, lastIndexOf)
  }

  const out = {}

  if (id.startsWith("http")) {
    out.type = "http"
    out.src = id
  } else if (
    id.startsWith("/") ||
    id.startsWith("./") ||
    id.startsWith("../")
  ) {
    out.type = "file"
    out.src = resolvePath(id)
  } else if (id.startsWith("@") === false && id.includes("/")) {
    const parts = id.split("/")
    const filename = parts.length > 2 ? "/" + parts.slice(2).join("/") : ""
    out.id = parts.slice(0, 2).join("/")
    out.type = "github"
    out.version = version || "main"
    out.src = `https://raw.githubusercontent.com/${out.id}/${out.version}${filename}`
  } else {
    out.id = id
    out.type = "npm"
    out.version = version || "latest"
    out.src = `https://registry.npmjs.org/${id}`
  }

  return out
}
