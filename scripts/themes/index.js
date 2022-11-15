import fs from "node:fs/promises"
import Jimp from "jimp"
import traceBitmap from "../../src/42/fabric/svg/traceBitmap.js"

const dirs = ["default"]

function resolve(url) {
  return new URL(url, import.meta.url).pathname
}

function generateSVG(name, d) {
  return `\
<svg id="picto-${name}" viewBox="0 0 16 16" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
  <path d="${d}"/>
</svg>
`
}

async function generateSVGFiles(dir) {
  const DIR_PATH = resolve(`../../src/42/themes/${dir}/pictos/`)

  try {
    await fs.rm(DIR_PATH, { recursive: true })
  } catch {}

  await fs.mkdir(DIR_PATH)

  const TXT_PATH = new URL(`./${dir}/pictos.txt`, import.meta.url).pathname
  const PNG_PATH = new URL(`./${dir}/pictos.png`, import.meta.url).pathname

  const [names, image] = await Promise.all([
    fs.readFile(TXT_PATH, "utf-8"),
    Jimp.read(PNG_PATH),
  ])

  const pictos = names
    .trim()
    .split("\n")
    .map((line) => line.split(" "))

  const tasks = []

  for (let i = 0, l = pictos.length; i < l; i++) {
    for (let j = 0, m = pictos[i].length; j < m; j++) {
      const name = pictos[i][j]
      const x = j * 16
      const y = i * 16
      const tile = image.clone()
      tile.crop(x, y, 16, 16)
      const { d } = traceBitmap(tile.bitmap)
      const svg = generateSVG(name, d)
      tasks.push(fs.writeFile(`${DIR_PATH}/${name}.svg`, svg, "utf-8"))
    }
  }

  await Promise.all(tasks)
}

await Promise.all(dirs.map((dir) => generateSVGFiles(dir)))
