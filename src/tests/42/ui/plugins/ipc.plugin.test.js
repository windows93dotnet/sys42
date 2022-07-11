import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

test.suite.timeout(2000)
test.suite.serial()

const tmp = test.utils.container({ id: "component-tests", keep: !true })

const { $ } = test.utils

function getVal(btn) {
  const out = {}
  for (const [key, val] of Object.entries(btn)) {
    out[key] = val.textContent
  }

  return out
}

test.serial.flaky("transfer state data cross-realms", async (t) => {
  const app = await ui(tmp(true), {
    class: "box-fit desktop",
    content: [
      {
        tag: "link#theme",
        rel: "stylesheet",
        href: "/style.css",
      },
      {
        tag: "button#incr",
        content: "{{cnt}}",
        on: { click: "{{cnt += 1}}" },
      },

      {
        content: {
          tag: "ui-sandbox",
          // permissions: "app",
          permissions: "trusted",
          content: [
            {
              tag: "button#iframe-incr",
              content: "{{cnt}}",
              on: { click: "{{cnt += 1}}" },
            },
            {
              tag: "button#dialog",
              content: "dialog",
              dialog: {
                label: "iframe ({{x}},{{y}})",
                content: {
                  tag: "button#dialog-incr",
                  content: "{{cnt}}",
                  on: { click: "{{cnt += 1}}" },
                },
              },
            },
          ],
          script: `
          app.query("#dialog")?.click()
          // setTimeout(() => app.query("#incr")?.click(), 800)
          `,
        },
      },
    ],

    state: {
      cnt: 42,
    },
  })

  const el = await $.waitFor("ui-dialog", { timeout: 1000 })
  t.eq(el.localName, "ui-dialog")

  const btn = {
    top: app.query("#incr"),
    iframe: app
      .query("ui-sandbox iframe")
      .contentDocument.querySelector("#iframe-incr"),
    dialog: el.querySelector("#dialog-incr"),
  }

  t.eq(getVal(btn), { top: "42", iframe: "42", dialog: "42" })

  btn.top.click()
  await app
  t.eq(getVal(btn), { top: "43", iframe: "42", dialog: "42" })

  await t.sleep(200)
  t.eq(getVal(btn), { top: "43", iframe: "43", dialog: "43" })

  btn.iframe.click()
  await t.sleep(200)
  t.eq(getVal(btn), { top: "44", iframe: "44", dialog: "44" })

  btn.dialog.click()
  await t.sleep(200)
  t.eq(getVal(btn), { top: "45", iframe: "45", dialog: "45" })
})
