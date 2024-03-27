export function normalizeHref(href) {
  return href.replace(/:(\d+):?(\d+)?$/, (_, l, c) => {
    c = c ? `&column=${c}` : ""
    return `?line=${l}${c}`
  })
}

export default normalizeHref
