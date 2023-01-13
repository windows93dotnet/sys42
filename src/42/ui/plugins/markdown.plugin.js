import parseMarkdown from "../../core/formats/markdown/parseMarkdown.js"

export default async function markdownPlugin() {
  return (def, { type }) => {
    if (type === "string") return parseMarkdown(def)
  }
}
