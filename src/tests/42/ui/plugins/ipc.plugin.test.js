import test from "../../../../42/test.js"
import system from "../../../../42/system.js"
import ui from "../../../../42/ui.js"

test.intg("cross-realms state data", async (t, { decay, dest, pickValues }) => {
  const app = await decay(
    ui(
      dest({ connect: true }),
      {
        tag: "body.box-fit.desktop",
        content: [
          {
            tag: "button#incr1",
            content: "{{cnt}}",
            click: "{{cnt++}}",
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
                click: "{{cnt++}}",
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
                  click: "{{cnt++}}",
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
                      click: "{{cnt++}}",
                    },
                  },
                },
              ],
              script: `app.el.querySelector("#btnDialog2")?.click()`,
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
                  click: "{{cnt++}}",
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
                      click: "{{cnt++}}",
                    },
                  },
                },
              ],
              script: `app.el.querySelector("#btnDialog3")?.click()`,
            },
          },
        ],

        state: {
          cnt: 0,
        },
      },
      { trusted: true }
    )
  )

  t.timeout("reset")

  globalThis.app = app

  app.el.querySelector("#btnDialog1").click()

  await new Promise((resolve) => {
    let cnt = 0
    t.utils.listen({ uidialogopen: () => ++cnt === 3 && resolve() })
  })

  t.timeout("reset")

  const sandbox1 = app.el.querySelector("#sandbox1 iframe").contentDocument
  const sandbox2 = app.el.querySelector("#sandbox2 iframe").contentDocument

  const btnDialogs = {
    btnDialog1: document.querySelector("#btnDialog1"),
    btnDialog2: sandbox1.querySelector("#btnDialog2"),
    btnDialog3: sandbox2.querySelector("#btnDialog3"),
    dialog1: document.querySelector("#dialog1"),
    dialog2: document.querySelector("#dialog2"),
    dialog3: document.querySelector("#dialog3"),
  }

  t.eq(pickValues(btnDialogs), {
    btnDialog1: "dialog 1",
    btnDialog2: "dialog 2",
    btnDialog3: "dialog 3",
    dialog1: "1 (100,100)0",
    dialog2: "2 (100,200)0",
    dialog3: "3 (100,300)0",
  })

  const btnIncr = {
    incr1: document.querySelector("#incr1"),
    incr2: sandbox1.querySelector("#incr2"),
    incr3: sandbox2.querySelector("#incr3"),
    dialogIncr1: document.querySelector("#dialogIncr1"),
    dialogIncr2: document.querySelector("#dialogIncr2"),
    dialogIncr3: document.querySelector("#dialogIncr3"),
  }

  t.eq(pickValues(btnIncr), {
    incr1: "0",
    incr2: "0",
    incr3: "0",
    dialogIncr1: "0",
    dialogIncr2: "0",
    dialogIncr3: "0",
  })

  btnIncr.incr1.click()
  await system.once("ipc.plugin:end-of-update")

  t.eq(pickValues(btnIncr), {
    incr1: "1",
    incr2: "1",
    incr3: "1",
    dialogIncr1: "1",
    dialogIncr2: "1",
    dialogIncr3: "1",
  })

  btnIncr.incr2.click()
  await system.once("ipc.plugin:end-of-update")

  t.eq(pickValues(btnIncr), {
    incr1: "2",
    incr2: "2",
    incr3: "2",
    dialogIncr1: "2",
    dialogIncr2: "2",
    dialogIncr3: "2",
  })

  btnIncr.incr3.click()
  await system.once("ipc.plugin:end-of-update")

  t.eq(pickValues(btnIncr), {
    incr1: "3",
    incr2: "3",
    incr3: "3",
    dialogIncr1: "3",
    dialogIncr2: "3",
    dialogIncr3: "3",
  })

  btnIncr.dialogIncr1.click()
  await system.once("ipc.plugin:end-of-update")

  t.eq(pickValues(btnIncr), {
    incr1: "4",
    incr2: "4",
    incr3: "4",
    dialogIncr1: "4",
    dialogIncr2: "4",
    dialogIncr3: "4",
  })

  btnIncr.dialogIncr2.click()
  await system.once("ipc.plugin:end-of-update")

  t.eq(pickValues(btnIncr), {
    incr1: "5",
    incr2: "5",
    incr3: "5",
    dialogIncr1: "5",
    dialogIncr2: "5",
    dialogIncr3: "5",
  })

  btnIncr.dialogIncr3.click()
  await system.once("ipc.plugin:end-of-update")

  t.eq(pickValues(btnIncr), {
    incr1: "6",
    incr2: "6",
    incr3: "6",
    dialogIncr1: "6",
    dialogIncr2: "6",
    dialogIncr3: "6",
  })

  btnDialogs.dialog1.close()
  await t.sleep(1)
  t.is(document.activeElement.id, btnDialogs.btnDialog1.id)

  btnDialogs.dialog2.close()
  await t.sleep(1)
  t.is(sandbox1.activeElement.id, btnDialogs.btnDialog2.id)

  btnDialogs.dialog3.close()
  await t.sleep(1)
  t.is(sandbox2.activeElement.id, btnDialogs.btnDialog3.id)
})
