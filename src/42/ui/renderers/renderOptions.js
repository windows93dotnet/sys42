import render from "../render.js"

function normalizeOptions(list) {
  return list.map((item) => {
    if (typeof item === "string") {
      return { tag: "option", content: item, label: item }
    }

    if (Array.isArray(item)) {
      return {
        tag: "option",
        content: item[1],
        label: item[1],
        value: item[0],
      }
    }

    item.label ??= item.content

    if (Array.isArray(item.content)) {
      item.tag ??= "optgroup"
      item.content = normalizeOptions(item.content)
    }

    return item
  })
}

export function renderOptions(el, ctx, plan) {
  if (Array.isArray(plan.content)) {
    plan.content = normalizeOptions(plan.content)
  }

  el.append(render(plan.content, ctx))
  delete plan.content
}

export default renderOptions
