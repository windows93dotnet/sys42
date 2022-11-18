import test from "../../../42/test.js"
import ui from "../../../42/ui.js"
import system from "../../../42/system.js"

import "../../../42/ui/components/dialog.js"
import "../../../42/ui/popup.js"

const manual = 0

const button = (label) => ({
  tag: `button#btnIncr${label}`,
  content: "{{cnt}}",
  click: "{{cnt++}}",
})

const buttons = (label) => ({
  tag: ".box-v",
  content: [
    button(label),
    {
      tag: `button#btnDialog${label}`,
      content: "dialog",
      dialog: {
        y: window.innerHeight / 2 - 70,
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
    {
      tag: `button#btnMenu${label}`,
      content: "menu",
      menu: [
        { label: "{{cnt}}", click: "{{cnt++}}" },
        {
          label: "Dialog",
          class: `menuitemDialog`,
          dialog: {
            y: window.innerHeight / 2 + 20,
            x:
              label === "Top"
                ? window.innerWidth / 2 - 200
                : window.innerWidth / 2 + 50,
            label: `Menu ${label}`,
            content: button(`MenuDialog${label}`),
          },
        },
      ],
    },
  ],
})

test.ui.flaky("popup behavior", async (t, { decay, dest, pickValues }) => {
  const app = decay(
    await ui(
      dest({ connect: true }),
      {
        tag: ".box-fit.box-center",
        content: {
          tag: ".box-h.w-full",
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
              script: `
                import puppet from "../../../42/core/dev/puppet.js"
                await puppet("#btnMenuIframe").click()
                await puppet("#btnDialogIframe").click()
              `,
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

  t.puppet("#btnDialogTop").click().run()
  t.puppet("#btnMenuTop").click().run()

  await new Promise((resolve) => {
    let cnt = 0
    t.utils.on({
      uipopupopen(e, target) {
        t.puppet(".menuitemDialog", target).click().run()
      },
      uidialogopen: () => ++cnt === 4 && resolve(),
    })
  })

  t.timeout("reset")

  if (manual) return t.pass()

  const iframe = app.el.querySelector("ui-sandbox iframe")
  const sandbox = iframe.contentDocument

  const incrBtns = {
    top: document.querySelector("#btnIncrTop"),
    dialogTop: document.querySelector("#btnIncrDialogTop"),
    menuDialogTop: document.querySelector("#btnIncrMenuDialogTop"),
    iframe: sandbox.querySelector("#btnIncrIframe"),
    dialogIframe: document.querySelector("#btnIncrDialogIframe"),
    menuDialogIframe: document.querySelector("#btnIncrMenuDialogIframe"),
  }

  const popupBtns = {
    top: document.querySelector("#btnPopupTop"),
    iframe: sandbox.querySelector("#btnPopupIframe"),
  }

  let cnt = 0

  async function checkPopupBtn(btn, label, options) {
    const sel = `#btnIncrPopup${label}`
    const puppet = t.puppet.makePuppet()

    t.is(
      btn.getAttribute("aria-expanded"),
      "false",
      "popup button should be closed"
    )

    await puppet(btn).dispatch("pointerdown").when("uipopupopen")

    t.is(
      btn.getAttribute("aria-expanded"),
      "true",
      "popup button should be open"
    )

    let incr = document.querySelector(sel)
    t.isElement(incr)

    let popupClosePromise

    if (options?.close) {
      popupClosePromise = t.utils.when("uipopupclose")
      await puppet(options.close).click()
    }

    if (options?.incr) {
      t.is(incr.textContent, String(cnt))
      t.eq(pickValues(incrBtns), {
        top: String(cnt),
        dialogTop: String(cnt),
        menuDialogTop: String(cnt),
        iframe: String(cnt),
        dialogIframe: String(cnt),
        menuDialogIframe: String(cnt),
      })

      incr.click()
      cnt++
      await system.once("ipc.plugin:end-of-update")

      t.is(incr.textContent, String(cnt))
      t.eq(pickValues(incrBtns), {
        top: String(cnt),
        dialogTop: String(cnt),
        menuDialogTop: String(cnt),
        iframe: String(cnt),
        dialogIframe: String(cnt),
        menuDialogIframe: String(cnt),
      })

      popupClosePromise = t.utils.when("uipopupclose")

      // popup is still open
      incr = document.querySelector(sel)
      t.isElement(incr)
      t.is(
        btn.getAttribute("aria-expanded"),
        "true",
        "popup button should be open"
      )

      await puppet(options.incr).click()
      await system.once("ipc.plugin:end-of-update")
      cnt++

      t.eq(pickValues(incrBtns), {
        top: String(cnt),
        dialogTop: String(cnt),
        menuDialogTop: String(cnt),
        iframe: String(cnt),
        dialogIframe: String(cnt),
        menuDialogIframe: String(cnt),
      })
    }

    await popupClosePromise
    await t.utils.idle() // TODO: verify why idle is needed

    // popup is closed
    incr = document.querySelector(sel)

    t.isNull(incr, `${sel} is still present`)
    t.is(
      btn.getAttribute("aria-expanded"),
      "false",
      "popup button should be closed"
    )
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

  await t.utils.idle()

  async function incr(btn) {
    await t.puppet(btn).click()
    await system.once("ipc.plugin:end-of-update")
    cnt++

    t.eq(pickValues(incrBtns), {
      top: String(cnt),
      dialogTop: String(cnt),
      menuDialogTop: String(cnt),
      iframe: String(cnt),
      dialogIframe: String(cnt),
      menuDialogIframe: String(cnt),
    })
  }

  await incr(incrBtns.dialogTop)
  await incr(incrBtns.dialogIframe)
  await incr(incrBtns.menuDialogTop)
  await incr(incrBtns.menuDialogIframe)
})
