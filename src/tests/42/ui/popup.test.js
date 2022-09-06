import test from "../../../42/test.js"
import ui from "../../../42/ui.js"
import system from "../../../42/system.js"

const button = (label) => ({
  tag: `button#btnIncr${label}`,
  content: "{{cnt}}",
  click: "{{cnt++}}",
})

const buttons = (label) => ({
  tag: ".box-h",
  content: [
    button(label),
    {
      tag: `button#btnDialog${label}`,
      content: "dialog",
      dialog: {
        x:
          label === "Top"
            ? window.innerWidth / 2 - 200
            : window.innerWidth / 2 + 50,
        label,
        content: button(`Dialog${label}`),
      },
    },
    {
      tag: `button#btnPopup${label}`,
      content: "popup",
      popup: {
        tag: ".panel.outset.pa-lg",
        content: [`hello from ${label}`, "\n\n", button(`Popup${label}`)],
      },
    },
  ],
})

test.intg("popup behavior", async (t, { collect, dest, pickValues }) => {
  const app = collect(
    await ui(
      dest(true),
      {
        tag: ".box-fit.box-center",
        content: {
          tag: ".box-v.w-full",
          content: [
            {
              tag: ".box-center.ground",
              content: buttons("Top"),
            },
            {
              tag: "ui-sandbox",
              // permissions: "app",
              permissions: "trusted",
              content: {
                tag: ".box-fit.box-center.desktop",
                content: buttons("Iframe"),
              },
              script: `app.query("#btnDialogIframe").click()`,
            },
          ],
        },
        state: {
          cnt: 0,
        },
      },
      { id: "popup-demo", trusted: true }
    )
  )

  app.query("#btnDialogTop").click()

  await new Promise((resolve) => {
    let cnt = 0
    t.utils.listen({ uidialogopen: () => ++cnt === 2 && resolve() })
  })

  t.timeout("reset")

  const iframe = app.query("ui-sandbox iframe")
  const sandbox = iframe.contentDocument

  const incrBtns = {
    top: document.querySelector("#btnIncrTop"),
    dialogTop: document.querySelector("#btnIncrDialogTop"),
    iframe: sandbox.querySelector("#btnIncrIframe"),
    dialogIframe: document.querySelector("#btnIncrDialogIframe"),
  }

  const popupBtns = {
    top: document.querySelector("#btnPopupTop"),
    iframe: sandbox.querySelector("#btnPopupIframe"),
  }

  let cnt = 0

  async function checkPopupBtn(btn, label, options) {
    const sel = `#btnIncrPopup${label}`

    t.is(
      btn.getAttribute("aria-expanded"),
      "false",
      "popup button should be closed"
    )

    btn.click()

    await t.utils.when("uipopupopen")

    t.is(
      btn.getAttribute("aria-expanded"),
      "true",
      "popup button should be open"
    )

    let incr = document.querySelector(sel)
    t.isElement(incr)

    if (options?.close) {
      options.close.focus()
      options.close.click()
      await t.sleep(30)
    }

    if (options?.incr) {
      t.is(incr.textContent, String(cnt))
      t.eq(pickValues(incrBtns), {
        top: String(cnt),
        dialogTop: String(cnt),
        iframe: String(cnt),
        dialogIframe: String(cnt),
      })

      incr.click()
      cnt++
      await system.once("ipc.plugin:end-of-update")
      await t.sleep(30)

      t.is(incr.textContent, String(cnt))
      t.eq(pickValues(incrBtns), {
        top: String(cnt),
        dialogTop: String(cnt),
        iframe: String(cnt),
        dialogIframe: String(cnt),
      })

      // popup is still open
      incr = document.querySelector(sel)
      t.isElement(incr)
      t.is(
        btn.getAttribute("aria-expanded"),
        "true",
        "popup button should be open"
      )

      options.incr.focus()
      options.incr.click()
      cnt++
      await t.sleep(30)

      t.eq(pickValues(incrBtns), {
        top: String(cnt),
        dialogTop: String(cnt),
        iframe: String(cnt),
        dialogIframe: String(cnt),
      })
    }

    // popup is closed
    incr = document.querySelector(sel)
    t.is(
      btn.getAttribute("aria-expanded"),
      "false",
      "popup button should be closed"
    )
    t.isNull(incr)
  }

  // self close
  await checkPopupBtn(popupBtns.top, "Top", { close: popupBtns.top })
  await checkPopupBtn(popupBtns.iframe, "Iframe", { close: popupBtns.iframe })

  // close with click
  await checkPopupBtn(popupBtns.top, "Top", { close: document.body })
  await checkPopupBtn(popupBtns.top, "Top", { close: iframe })
  await checkPopupBtn(popupBtns.iframe, "Iframe", { close: document.body })
  await checkPopupBtn(popupBtns.iframe, "Iframe", { close: iframe })

  // counter button
  await checkPopupBtn(popupBtns.top, "Top", { incr: incrBtns.top })
  await checkPopupBtn(popupBtns.top, "Top", { incr: incrBtns.iframe })
  await checkPopupBtn(popupBtns.iframe, "Iframe", { incr: incrBtns.top })
  await checkPopupBtn(popupBtns.iframe, "Iframe", { incr: incrBtns.iframe })
})
