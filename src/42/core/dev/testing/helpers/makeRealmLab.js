import ui from "../../../../ui.js"
import inTop from "../../../env/realm/inTop.js"
import uid from "../../../uid.js"

import "../../../../ui/popup.js"

const DEFAULT = {
  top: true,
  iframe: true,
  syncData: true,
  nestedTestsParallel: false,
}

export async function makeRealmLab(t, options, makeContent) {
  const id = uid()
  const initiator = new URLSearchParams(location.search).get("initiator")

  if (typeof options === "function") {
    makeContent = options
    options = {}
  }

  const config = { ...DEFAULT, ...options }
  const { href, top, iframe, syncData, nestedTestsParallel } = config

  const path = new URL(href)
  if (syncData) path.searchParams.set("initiator", id)
  if (nestedTestsParallel) path.searchParams.set("nestedTestsParallel", true)
  path.searchParams.set("test", true)

  const whenAllRealmReady = async () => {
    if (inTop) {
      return new Promise((resolve) => {
        globalThis.addEventListener("message", async (e) => {
          if (e.data === id) resolve()
        })
      })
    }

    globalThis.parent.postMessage(initiator)
  }

  const app = await t.utils.decay(
    ui(
      t.utils.dest({ connect: true }),
      inTop
        ? {
            tag: ".box-fit.desktop",
            content: {
              tag: ".box-h.size-full",
              content: [
                top ? makeContent() : undefined,
                iframe
                  ? {
                      tag: "ui-sandbox.ground",
                      permissions: "trusted",
                      path,
                    }
                  : undefined,
              ],
            },
          }
        : {
            tag: ".box-fit",
            content: makeContent(),
          },
      inTop ? { id, trusted: true } : syncData ? { initiator } : undefined,
    ),
  )

  if (nestedTestsParallel && iframe) await whenAllRealmReady()

  return app
}

export default makeRealmLab
