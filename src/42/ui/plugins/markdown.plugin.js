import parseMarkdown from "../../core/formats/markdown/parseMarkdown.js"

export default async function markdownPlugin() {
  return (plan) => {
    if (typeof plan === "string") {
      const tokens = parseMarkdown(plan)
      if (tokens.length > 1 || tokens[0]?.tag) {
        return tokens
      }
    }
  }
}
