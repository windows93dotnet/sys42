import inTop from "../../../env/realm/inTop.js"
import { SilentError } from "../classes/Assert.js"
import timeout from "../../../../fabric/type/promise/timeout.js"
import noop from "../../../../fabric/type/function/noop.js"
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
  config.makeContent ??= noop

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
      timeout(3000, "Glovebox timed out: 3000"),
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
            tag: ".box-v.box-fit.ground.pa-0",
            content: [
              {
                tag: "style",
                content: `
                .realm-label {
                  padding: 1px 5px;
                  position: absolute;
                  margin-top: -2ex;
                  z-index: 5;
                  right: calc(50% + var(--unit));
                }
                .realm-label + .realm-label {
                  right: calc(2 * var(--unit));
                }
                `,
              },
              {
                tag: "h1.font-mono.ma-0.pa-xl",
                content: [
                  { tag: "span", style: "color:#555", content: "[🧤🧪] " },
                  t.test.title,
                ],
              },
              {
                tag: ".item-shrink",
                content: [
                  { tag: "span.tooltip.realm-label", content: "Top" },
                  { tag: "span.tooltip.realm-label", content: "Iframe" },
                ],
              },
              {
                tag: ".ma.ma-t-0",
                content: {
                  tag: ".box-cols.h-full.gap",
                  content: [
                    top
                      ? { tag: ".panel.inset", content: makeContent() }
                      : { tag: "div" },
                    iframe
                      ? {
                          tag: "ui-sandbox.panel.inset",
                          permissions: "trusted",
                          path,
                        }
                      : undefined,
                  ],
                },
              },
              {
                tag: ".item-shrink",
                style: "height:100px",
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
