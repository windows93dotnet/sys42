import test from "../../../../42/test.js"
import log from "../../../../42/core/log.js"
import create from "../../../../42/ui/create.js"

import traceBitmap from "../../../../42/fabric/svg/traceBitmap.js"

import loadImage from "../../../../42/core/load/loadImage.js"
import loadText from "../../../../42/core/load/loadText.js"

const shared = {}

const LOGGING_PICTOS = {
  '{"h":1}': "ğ ",
  '{"h":-1}': "ğ ",
  '{"v":1}': "ğ ",
  '{"v":-1}': "ğ ",
  '{"junction":1}': "â¬",
  '{"junction":2}': "â¬¤",
}

const logMove = (x) => "\tâ" + (LOGGING_PICTOS[JSON.stringify(x)] ?? "")
const logDirections = (d) => `
${d[0].map((_, i) => "\t " + i).join("")}
    ${d[0].map(() => "").join(`â¼âââ`)}â¼âââ
${d
  .map((a, i) => i + a.map(logMove).join(""))
  .join(`\n    ${"â¼âââ".repeat(Number(d[0].length))}\n`)}
    ${d[0].map(() => "").join(`âµ   `)}âµ
`

/* ------------------- */

test.setup(async () => {
  let [expecteds, image] = await Promise.all([
    loadText("/tests/42/fabric/svg/traceBitmap/expected.txt"),
    loadImage("/tests/42/fabric/svg/traceBitmap/tiles.png"),
  ])

  const { width, height } = image
  shared.canvas = create("canvas")
  shared.width = width
  shared.canvas.width = width
  shared.height = height
  shared.canvas.height = height

  const ctx = shared.canvas.getContext("2d", { willReadFrequently: true })
  ctx.drawImage(image, 0, 0)
  shared.ctx = ctx

  expecteds = expecteds.trimEnd().split(/\r?\n/)
  shared.expecteds = expecteds
})

test.noop("debug single path", async (t) => {
  const { d, directions } = traceBitmap(
    shared.ctx.getImageData(16 * 0, 16 * 12, 16, 16)
  )
  document.body.append(
    create(
      "svg",
      {
        style: { width: "300px", height: "auto" },
        width: 16,
        height: 16,
        viewBox: "0 0 16 16",
      },
      create("path", { d })
    )
  )
  log(logDirections(directions))
  t.pass()
})

test("check path data fixtures", async (t) => {
  let cnt = 0

  for (let y = 0; y < shared.height; y += 16) {
    for (let x = 0; x < shared.width; x += 16) {
      const { d: actual } = traceBitmap(shared.ctx.getImageData(x, y, 16, 16))
      t.is(actual, shared.expecteds[cnt++], `Error at tile x:${x} y:${y}`)
    }
  }
})

test("compare generated svg with original image", async (t) => {
  const { width, height } = shared
  const { d } = traceBitmap(shared.ctx.getImageData(0, 0, width, height))

  shared.svg = create("svg", { width, height }, create("path", { d }))
  // document.body.append(shared.svg);

  const image = await loadImage(
    "data:image/svg+xml," +
      shared.svg.outerHTML.replace(
        "<svg ",
        "<svg  xmlns='http://www.w3.org/2000/svg' "
      )
  )

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  ctx.drawImage(image, 0, 0)
  // document.body.append(canvas)

  const expectedImageData = shared.ctx.getImageData(0, 0, width, height)
  const actualImageData = ctx.getImageData(0, 0, width, height)
  t.eq(actualImageData, expectedImageData)
})
