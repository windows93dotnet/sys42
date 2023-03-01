// import render from "../render.js"

export function renderTooltip(el, tooltip /* , stage */) {
  // TODO: use render for tooltip
  // const res = render(tooltip, stage)

  el.dataset.tooltip = tooltip
  if (!el.hasAttribute("aria-label")) {
    el.setAttribute("aria-label", tooltip)
  }
}

export default renderTooltip
