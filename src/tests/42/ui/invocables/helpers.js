import ui from "../../../../42/ui.js"
import system from "../../../../42/core/dev/testing/mainSystem.js"
import defer from "../../../../42/fabric/type/promise/defer.js"
import preload from "../../../../42/core/load/preload.js"
import inTop from "../../../../42/core/env/realm/inTop.js"

let res = defer()
export function log(arg) {
  if (system.testing.manual) console.log({ inTop }, arg)
  res.resolve(arg)
}

const { top } = globalThis
const { body } = top.document

export async function launch(t, open, close, fn) {
  await t.puppet(open).click()
  const { target } = await t.utils.when(top, "uidialogopen")
  await fn?.(target)
  if (close === false) return
  await t.puppet(close, body).click()
  const tmp = await res
  res = defer()
  return tmp
}

export async function make(t, { href, makeContent }) {
  const app = await t.utils.decay(
    ui(
      t.utils.dest({ connect: true }),
      {
        tag: inTop ? ".box-fit.desktop" : ".box-fit",
        content: inTop
          ? {
              tag: ".box-v.size-full",
              content: [
                makeContent(),
                {
                  tag: "ui-sandbox.ground",
                  permissions: "trusted",
                  path: href,
                },
              ],
            }
          : makeContent(),
      },
      { trusted: true }
    )
  )

  return app
}

export default {
  preload,
  launch,
  make,
  log,
}
export { default as preload } from "../../../../42/core/load/preload.js"
