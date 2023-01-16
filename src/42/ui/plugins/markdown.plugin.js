import parseMarkdown from "../../core/formats/markdown/parseMarkdown.js"

export default async function markdownPlugin() {
  return (plan, stage) => {
    if (stage.type === "string") {
      stage.type = "array"
      return parseMarkdown(plan)
    }
  }
}
