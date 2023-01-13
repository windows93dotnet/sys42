import parseMarkdown from "../../core/formats/markdown/parseMarkdown.js"

export default async function markdownPlugin() {
  return (plan, { type }) => {
    if (type === "string") return parseMarkdown(plan)
  }
}
