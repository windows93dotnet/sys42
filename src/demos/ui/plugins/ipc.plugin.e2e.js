import system from "../../../42/system.js"
import ui from "../../../42/ui.js"
import e2e from "../../../42/core/dev/testing/e2e.js"

const { listen } = e2e.utils

function getVal(btn) {
  const out = {}
  for (const [key, val] of Object.entries(btn)) {
    out[key] = val.textContent
  }

  return out
}

export default e2e(async (t, { container, cleanup }) => {
  system.DEV = true
  // import sleep from "../../../42/fabric/type/promise/sleep.js"

  const app = await ui(
    container,
    {
      tag: "body.box-fit.desktop",
      content: [
        {
          tag: "button#incr1",
          content: "{{cnt}}",
          click: "{{cnt += 1}}",
        },

        {
          tag: "button#btnDialog1",
          content: "dialog 1",
          dialog: {
            id: "dialog1",
            x: 100,
            y: 100,
            label: "1 ({{x}},{{y}})",
            content: {
              tag: "button#dialogIncr1",
              content: "{{cnt}}",
              click: "{{cnt += 1}}",
            },
          },
        },

        {
          content: {
            tag: "ui-sandbox#sandbox1",
            permissions: "trusted",
            content: [
              {
                tag: "button#incr2",
                content: "{{cnt}}",
                click: "{{cnt += 1}}",
              },
              {
                tag: "button#btnDialog2",
                content: "dialog 2",
                dialog: {
                  id: "dialog2",
                  x: 100,
                  y: 200,
                  label: "2 ({{x}},{{y}})",
                  content: {
                    tag: "button#dialogIncr2",
                    content: "{{cnt}}",
                    click: "{{cnt += 1}}",
                  },
                },
              },
            ],
            script: `app.query("#btnDialog2")?.click()`,
          },
        },

        {
          content: {
            tag: "ui-sandbox#sandbox2",
            permissions: "trusted",
            content: [
              {
                tag: "button#incr3",
                content: "{{cnt}}",
                click: "{{cnt += 1}}",
              },
              {
                tag: "button#btnDialog3",
                content: "dialog 3",
                dialog: {
                  id: "dialog3",
                  x: 100,
                  y: 300,
                  label: "3 ({{x}},{{y}})",
                  content: {
                    tag: "button#dialogIncr3",
                    content: "{{cnt}}",
                    click: "{{cnt += 1}}",
                  },
                },
              },
            ],
            script: `app.query("#btnDialog3")?.click()`,
          },
        },
      ],

      state: {
        cnt: 42,
      },
    },
    { trusted: true }
  )

  cleanup(app)

  globalThis.app = app

  app.query("#btnDialog1").click()

  await new Promise((resolve) => {
    let cnt = 0
    listen({ dialogopen: () => ++cnt === 3 && resolve() })
  })

  const sandbox1 = app.query("#sandbox1 iframe").contentDocument
  const sandbox2 = app.query("#sandbox2 iframe").contentDocument

  const btnDialogs = {
    btnDialog1: document.querySelector("#btnDialog1"),
    btnDialog2: sandbox1.querySelector("#btnDialog2"),
    btnDialog3: sandbox2.querySelector("#btnDialog3"),
    dialog1: document.querySelector("#dialog1"),
    dialog2: document.querySelector("#dialog2"),
    dialog3: document.querySelector("#dialog3"),
  }

  t.eq(getVal(btnDialogs), {
    btnDialog1: "dialog 1",
    btnDialog2: "dialog 2",
    btnDialog3: "dialog 3",
    dialog1: "1 (100,100)42",
    dialog2: "2 (100,200)42",
    dialog3: "3 (100,300)42",
  })

  const btnIncr = {
    incr1: document.querySelector("#incr1"),
    incr2: sandbox1.querySelector("#incr2"),
    incr3: sandbox2.querySelector("#incr3"),
    dialogIncr1: document.querySelector("#dialogIncr1"),
    dialogIncr2: document.querySelector("#dialogIncr2"),
    dialogIncr3: document.querySelector("#dialogIncr3"),
  }

  t.eq(getVal(btnIncr), {
    incr1: "42",
    incr2: "42",
    incr3: "42",
    dialogIncr1: "42",
    dialogIncr2: "42",
    dialogIncr3: "42",
  })

  btnIncr.incr1.click()
  await system.once("ipc.plugin:end")

  t.eq(getVal(btnIncr), {
    incr1: "43",
    incr2: "43",
    incr3: "43",
    dialogIncr1: "43",
    dialogIncr2: "43",
    dialogIncr3: "43",
  })

  btnIncr.incr2.click()
  await system.once("ipc.plugin:end")

  t.eq(getVal(btnIncr), {
    incr1: "44",
    incr2: "44",
    incr3: "44",
    dialogIncr1: "44",
    dialogIncr2: "44",
    dialogIncr3: "44",
  })

  btnIncr.incr3.click()
  await system.once("ipc.plugin:end")

  t.eq(getVal(btnIncr), {
    incr1: "45",
    incr2: "45",
    incr3: "45",
    dialogIncr1: "45",
    dialogIncr2: "45",
    dialogIncr3: "45",
  })

  btnIncr.dialogIncr1.click()
  await system.once("ipc.plugin:end")

  t.eq(getVal(btnIncr), {
    incr1: "46",
    incr2: "46",
    incr3: "46",
    dialogIncr1: "46",
    dialogIncr2: "46",
    dialogIncr3: "46",
  })

  btnIncr.dialogIncr2.click()
  await system.once("ipc.plugin:end")

  t.eq(getVal(btnIncr), {
    incr1: "47",
    incr2: "47",
    incr3: "47",
    dialogIncr1: "47",
    dialogIncr2: "47",
    dialogIncr3: "47",
  })

  btnIncr.dialogIncr3.click()
  await system.once("ipc.plugin:end")

  t.eq(getVal(btnIncr), {
    incr1: "48",
    incr2: "48",
    incr3: "48",
    dialogIncr1: "48",
    dialogIncr2: "48",
    dialogIncr3: "48",
  })

  btnDialogs.dialog1.close()
  await t.sleep(0)
  t.is(document.activeElement.id, btnDialogs.btnDialog1.id)

  btnDialogs.dialog2.close()
  await t.sleep(0)
  t.is(sandbox1.activeElement.id, btnDialogs.btnDialog2.id)

  btnDialogs.dialog3.close()
  await t.sleep(0)
  t.is(sandbox2.activeElement.id, btnDialogs.btnDialog3.id)
})
