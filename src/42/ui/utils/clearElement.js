export default function clearElement(el) {
  const keep = []
  for (const child of el.children) {
    if (child.hasAttribute("data-steady")) keep.push(child)
  }

  el.replaceChildren(...keep)
}
