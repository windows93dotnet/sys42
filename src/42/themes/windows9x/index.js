import defer from "../../fabric/type/promise/defer.js"
import cssVar from "../../fabric/cssom/cssVar.js"

const NS = "http://www.w3.org/2000/svg"

const ready = defer()
let spritesTemplate
const styles = document.createElement("style")

export function install() {
  const filters = document.createElementNS(NS, "svg")
  filters.style = "position:absolute;pointer-events:none;"

  const disabledInset = document.createElementNS(NS, "filter")
  disabledInset.id = "disabled-inset"
  /* @src https://github.com/1j01/98/blob/master/programs/explorer/index.html#L165 */
  disabledInset.innerHTML = `
<feComponentTransfer in="SourceGraphic" result="contrast">
  <feFuncR type="discrete" tableValues="0 0.5 0 1"/>
  <feFuncG type="discrete" tableValues="0 0.5 0 1"/>
  <feFuncB type="discrete" tableValues="0 0.5 0 1"/>
  <feFuncA type="discrete" tableValues="0 0.5 0 1"/>
</feComponentTransfer>
<feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -1000 -1000 -1000 1 0" in="contrast" result="black-isolated" />
<feFlood flood-color="var(--ButtonShadow)" result="shadow-color" />
<feFlood flood-color="var(--ButtonHilight)" result="hilight-color" />
<feOffset dx="1" dy="1" in="black-isolated" result="offset" />
<feComposite operator="in" in="hilight-color" in2="offset" result="hilight" />
<feComposite operator="in" in="shadow-color" in2="black-isolated" result="shadow" />
<feMerge><feMergeNode in="hilight" /><feMergeNode in="shadow" /></feMerge>
`
  filters.append(disabledInset)
  document.body.append(styles)
  document.body.append(filters)

  window.addEventListener("resize", () => {
    // work around a browser bug in Chrome where
    // the SVG filter behaves differently based on the INITIAL zoom level
    // (if you zoom in, the icons get cut off, if you zoom out, the effect is too thick)
    disabledInset.setAttribute("x", "0")
  })

  fetch(new URL("./sprites.svg", import.meta.url))
    .then((res) => res.text())
    .then((sprites) => {
      spritesTemplate = sprites
      ready.resolve()
      refresh()
    })
}

export async function refresh() {
  await ready
  const s = spritesTemplate
    .replaceAll("rgb(0 0 0)", cssVar.get("--ButtonText"))
    .replaceAll("rgb(64 64 64)", cssVar.get("--ButtonDkShadow"))
    .replaceAll("rgb(128 128 128)", cssVar.get("--ButtonShadow"))
    .replaceAll("rgb(255 255 255)", cssVar.get("--ButtonHilight"))
    .replaceAll("#", "%23")
    .replaceAll("  ", " ")
    .replaceAll("\n", "")

  styles.textContent = `
  :root {
    --sprites-url: url('data:image/svg+xml,${s}');
  }`
}
