import inTop from "../../../env/realm/inTop.js"
import "../../../../ui/popup.js"

const DEFAULT = {
  top: true,
  iframe: true,
  syncData: true,
  nestedTestsParallel: false,
}

let ui

export async function makeRealmLab(t, options, makeContent) {
  const id = `test--${t.test.slug}`
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

  const untilAllRealmReady = async () => {
    if (inTop) {
      return new Promise((resolve) => {
        globalThis.addEventListener("message", async (e) => {
          if (e.data === id) resolve()
        })
      })
    }

    globalThis.parent.postMessage(initiator)
  }

  ui ??= await import("../../../../ui.js") //
    .then((m) => m.default)

  const app = await t.utils.decay(
    ui(
      t.utils.dest({ connect: true }),
      inTop
        ? {
            tag: ".box-v.box-fit.desktop",
            content: [
              {
                tag: "h1.code.ma-0.pa-xl",
                content: "🧪 " + t.test.title,
              },
              {
                tag: ".box-h",
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
            ],
          }
        : {
            tag: ".box-fit",
            content: makeContent(),
          },
      inTop ? { id, trusted: true } : syncData ? { initiator } : undefined,
    ),
  )

  if (nestedTestsParallel && iframe) {
    t.timeout("reset")
    await untilAllRealmReady()
    t.timeout("reset")
  }

  return app
}

export default makeRealmLab
