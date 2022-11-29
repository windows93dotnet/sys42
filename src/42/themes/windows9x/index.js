/* eslint-disable guard-for-in */
import cssVar from "../../fabric/cssom/cssVar.js"

// [1] 1j01 solution to Chrome bug with filters on browser zoom
// @see https://github.com/1j01/98/blob/34a69bf37d77f0ffbb50840f6622717202e41790/programs/explorer/index.html#L191

const NS = "http://www.w3.org/2000/svg"
const styles = document.createElement("style")

const imagesKeys = [
  "--fld-bdi-url",
  "--btn-bdi-url",
  "--outset-bdi-url",
  "--outset-shallow-bdi-url",

  "--btn☑️-bdi-url",
  "--btn👇-bdi-url",
  "--btn💾-bdi-url",
  "--fieldset-bdi-url",
  "--radio-bdi-url",
  "--tabs__tab-bdi-url",

  "--addon-bg-url",
  "--screentone-url",
  "--scrollbar-sprites-url",

  "--picto--up-xs",
  "--picto--down-xs",
  "--picto--down",
  "--picto--calendar",
  "--picto--import",
  "--input-datalist-picto",

  "--picto--up-xs--d",
  "--picto--down-xs--d",
  "--picto--down--d",
  "--picto--calendar--d",
  "--picto--import--d",
  "--input-datalist-picto--d",
]

const colorsRef = {
  "--ButtonFace": "rgb(212 208 200)",
  "--ButtonText": "rgb(0 0 0)",
  "--ButtonDkShadow": "rgb(64 64 64)",
  "--ButtonShadow": "rgb(128 128 128)",
  "--ButtonLight": "rgb(223 223 223)",
  "--ButtonHilight": "rgb(255 255 255)",
}

const images = Object.create(null)
const colors = Object.create(null)

export function install() {
  const filters = document.createElementNS(NS, "svg")
  filters.id = "windows9x-filters"
  filters.toggleAttribute("hidden", true)
  filters.setAttribute("aria-hidden", true)

  const disabledInset = document.createElementNS(NS, "filter")
  disabledInset.id = "disabled-inset"
  /* @src https://github.com/1j01/98/blob/34a69bf37d77f0ffbb50840f6622717202e41790/programs/explorer/index.html#L165 */
  disabledInset.innerHTML = /* svg */ `
<feComponentTransfer in="SourceGraphic" result="contrast">
  <feFuncR type="discrete" tableValues="0 0.5 0 1"/>
  <feFuncG type="discrete" tableValues="0 0.5 0 1"/>
  <feFuncB type="discrete" tableValues="0 0.5 0 1"/>
  <feFuncA type="discrete" tableValues="0 0.5 0 1"/>
</feComponentTransfer>
<feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -1 -1 -1 1 0" in="contrast" result="black-isolated" />
<feFlood flood-color="var(--ButtonShadow)" result="shadow-color" />
<feFlood flood-color="var(--ButtonHilight)" result="hilight-color" />
<feOffset dx="1" dy="1" in="black-isolated" result="offset" />
<feComposite operator="in" in="hilight-color" in2="offset" result="hilight" />
<feComposite operator="in" in="shadow-color" in2="black-isolated" result="shadow" />
<feMerge><feMergeNode in="hilight" /><feMergeNode in="shadow" /></feMerge>
`
  filters.append(disabledInset)
  document.head.append(styles)
  document.documentElement.append(filters)

  window.addEventListener("resize", () => {
    disabledInset.setAttribute("x", "0") // [1]
  })

  for (const key of imagesKeys) images[key] = cssVar.get(key)
  refresh()
}

function replaceColors(s) {
  for (const [key, val] of Object.entries(colorsRef)) {
    s = s.replaceAll(val, colors[key])
  }

  return s
}

export async function refresh() {
  for (const key of Object.keys(colorsRef)) colors[key] = cssVar.get(key)

  let styleContent = ""

  for (const key in images) {
    styleContent += `  ${key}:${replaceColors(images[key])};\n`
  }

  styles.textContent = `:root {\n${styleContent}}`
}
