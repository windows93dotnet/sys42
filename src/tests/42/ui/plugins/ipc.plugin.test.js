import test from "../../../../42/test.js"
import system from "../../../../42/system.js"
import ui from "../../../../42/ui.js"
import ipc from "../../../../42/core/ipc.js"

test.ui("data sync on inserted iframe", async (t) => {
  const dest = t.utils.dest({ connect: true })
  const id = t.test.slug
  const app = await t.utils.decay(
    ui(
      dest,
      {
        content: {
          tag: "button#btnIncr",
          content: "{{cnt}}",
          click: "{{cnt++}}",
        },

        state: {
          cnt: 0,
        },

        plugins: ["ipc"],
      },
      { id },
    ),
  )

  t.is(app.state.cnt, 0)
  await t.puppet("#btnIncr").click()
  t.is(app.state.cnt, 1)

  const iframe = document.createElement("iframe")
  iframe.style = "border: 1px solid"
  iframe.srcdoc = `
<script type="module">
  import ui from "../../../../42/ui.js"
  window.app = ui(
    {
      content: {
        tag: "button#btnIncr",
        content: "{{cnt}}",
        click: "{{cnt++}}",
      },

      state: {
        cnt: 0,
      },
    },
    { initiator: "${id}" },
  )
</script>`

  dest.append(iframe)

  await t.step(ipc.once(`42-ui-ipc-handshake-${id}`))
  const iframeApp = iframe.contentWindow.app
  await t.step(iframeApp.stage.reactive.once("update"))

  t.is(iframeApp.state.cnt, 1)
})

test.ui("cross-realms state data", async (t, { pickValues }) => {
  const app = await t.step(
    t.utils.decay(
      ui(
        t.utils.dest({ connect: true }),
        {
          tag: ".box-fit.box-v",
          content: [
            {
              tag: ".bd-b",
              content: [
                { tag: "h2", content: "Top" },
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
              ],
            },

            {
              content: {
                tag: "ui-sandbox#sandbox1.bd-b",
                permissions: "trusted",
                content: [
                  { tag: "h2", content: "Sandbox 1" },
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
              },
            },

            {
              content: {
                tag: "ui-sandbox#sandbox2.bd-b",
                permissions: "trusted",
                content: [
                  { tag: "h2", content: "Sandbox 2" },
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
              },
            },
          ],

          state: {
            cnt: 0,
          },
        },
        { trusted: true },
      ),
    ),
  )

  window.app = app

  const sandbox1Realm = app.el.querySelector("#sandbox1 iframe").contentWindow
  const sandbox2Realm = app.el.querySelector("#sandbox2 iframe").contentWindow
  const sandbox1 = sandbox1Realm.document
  const sandbox2 = sandbox2Realm.document

  await t.step(Promise.all([sandbox1Realm.app, sandbox2Realm.app]))

  const btnDialog1 = document.querySelector("#btnDialog1")
  const btnDialog2 = sandbox1.querySelector("#btnDialog2")
  const btnDialog3 = sandbox2.querySelector("#btnDialog3")

  btnDialog1.click()
  btnDialog2.click()
  btnDialog3.click()

  await t.step(
    new Promise((resolve) => {
      let cnt = 0
      t.utils.on({ "ui:dialog.open": () => ++cnt === 3 && resolve() })
    }),
  )

  const dialogs = {
    dialog1: document.querySelector("#dialog1"),
    dialog2: document.querySelector("#dialog2"),
    dialog3: document.querySelector("#dialog3"),
  }

  t.eq(pickValues(dialogs), {
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

  async function click(btn) {
    const promise = Promise.all([
      system.once("ipc.plugin:end-of-update"),
      app.stage.reactive.once("update"),
    ])
    btn.click()
    await promise
    await t.utils.untilRepaint()
  }

  await click(btnIncr.incr1)
  t.eq(pickValues(btnIncr), {
    incr1: "1",
    incr2: "1",
    incr3: "1",
    dialogIncr1: "1",
    dialogIncr2: "1",
    dialogIncr3: "1",
  })

  await click(btnIncr.incr2)
  t.eq(pickValues(btnIncr), {
    incr1: "2",
    incr2: "2",
    incr3: "2",
    dialogIncr1: "2",
    dialogIncr2: "2",
    dialogIncr3: "2",
  })

  await click(btnIncr.incr3)
  t.eq(pickValues(btnIncr), {
    incr1: "3",
    incr2: "3",
    incr3: "3",
    dialogIncr1: "3",
    dialogIncr2: "3",
    dialogIncr3: "3",
  })

  await click(btnIncr.dialogIncr1)
  t.eq(pickValues(btnIncr), {
    incr1: "4",
    incr2: "4",
    incr3: "4",
    dialogIncr1: "4",
    dialogIncr2: "4",
    dialogIncr3: "4",
  })

  await click(btnIncr.dialogIncr2)
  t.eq(pickValues(btnIncr), {
    incr1: "5",
    incr2: "5",
    incr3: "5",
    dialogIncr1: "5",
    dialogIncr2: "5",
    dialogIncr3: "5",
  })

  await click(btnIncr.dialogIncr3)
  t.eq(pickValues(btnIncr), {
    incr1: "6",
    incr2: "6",
    incr3: "6",
    dialogIncr1: "6",
    dialogIncr2: "6",
    dialogIncr3: "6",
  })

  await t.utils.closeDialog(dialogs.dialog1, btnDialog1)
  t.is(document.activeElement.id, btnDialog1.id)

  await t.utils.closeDialog(dialogs.dialog2, btnDialog2)
  t.is(sandbox1.activeElement.id, btnDialog2.id)

  await t.utils.closeDialog(dialogs.dialog3, btnDialog3)
  t.is(sandbox2.activeElement.id, btnDialog3.id)
})
