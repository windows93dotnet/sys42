import render from "../render.js"
import parseMarkdown from "../../system/formats/markdown/parseMarkdown.js"
import registerRenderer from "../utils/registerRenderer.js"
import template from "../../system/formats/template.js"
import create from "../create.js"

export default function renderText(text, ctx, parent, textElement) {
  text = String(text)

  if (ctx.markdown !== false) {
    const tokens = parseMarkdown(text)

    if (!(tokens.length === 1 && tokens[0] === text)) {
      const el = textElement
        ? create(textElement)
        : document.createDocumentFragment()
      ctx.markdown = false
      render(tokens, ctx, el)
      parent.append(el)
      return el
    }
  }

  const parsed = template.parse(text)

  const el = textElement
    ? create(textElement, text)
    : document.createTextNode(text)

  if (parsed.substitutions.length > 0) {
    registerRenderer.fromTemplate(ctx, parsed, async (value) => {
      el.textContent = value
    })
  }

  parent.append(el)

  return el
}
