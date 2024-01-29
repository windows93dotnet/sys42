import inTop from "../../../env/realm/inTop.js"
import timeout from "../../../../fabric/type/promise/timeout.js"
import "../../../../ui/popup.js"

const DEFAULT = {
  top: true,
  iframe: true,
  syncData: true,
}

const initiator = new URLSearchParams(location.search).get("initiator")

let ui

export async function glovebox(t, options) {
  const config = { ...DEFAULT, ...options }

  const {
    id, //
    makeContent,
    href,
    top,
    iframe,
    syncData,
  } = config

  const path = new URL(href)
  if (!syncData) path.searchParams.set("parallel", true)
  path.searchParams.set("initiator", id)
  path.searchParams.set("test", true)

  if (inTop && iframe) {
    t.glovebox.ready = Promise.race([
      timeout(1000, "Glovebox timed out: 1000"),
      new Promise((resolve) => {
        window.addEventListener("message", function handler({ data }) {
          if (data === id) {
            resolve()
            window.removeEventListener("message", handler)
          }
        })
      }),
    ])
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
                content: [
                  { tag: "span", style: "color:#555", content: "[🧤🧪] " },
                  t.test.title,
                ],
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

  if (inTop && !top) throw new SilentError()

  return { app }
}

export default glovebox
