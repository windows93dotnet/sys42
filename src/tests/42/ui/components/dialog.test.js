import test from "../../../../42/test.js"
import dialog from "../../../../42/ui/components/dialog.js"

const { href } = new URL(
  "../../../../demos/ui/components/dialog.demo.html",
  import.meta.url,
)

test.utils.preload(href, { prefetch: true, catchError: true })

test.ui("dialog controller", async (t) => {
  await t.glovebox({
    href,
    iframe: true,
    top: true,
    makeContent: () => ({
      tag: "text",
      id: "openerInput",
      autofocus: true,
    }),
  })

  const { inTop } = test.env.realm

  const controller = await dialog({
    label: inTop ? "From Top" : "From Iframe",
    id: "dialog" + (inTop ? "Top" : "Iframe"),
    x: 10,
    y: "{{y}}",
    width: "{{w}}",
    height: 250,
    state: {
      y: 60,
      w: 350,
    },
  })

  t.is(await controller.x, 10)
  t.is(await controller.height, 250)

  let el
  if (inTop) {
    el = controller.el
    await el.ready
    t.is(controller.id, "dialogTop")
    t.is(el.textContent, "From Top")
  } else {
    t.throws(() => controller.el, /not accessible/)
    await controller.ready
    el = window.top.document.querySelector("#dialogIframe")
    t.is(controller.id, "dialogIframe")
    t.is(el.textContent, "From Iframe")
  }

  t.is(el.style.translate, "10px 60px")
  t.is(el.style.width, "350px")

  // props
  // -----

  controller.x = 100
  t.is(await controller.x, 100)
  t.is(el.style.translate, "10px 60px")
  await t.utils.untilRepaint()
  t.is(el.style.translate, "100px 60px")

  // states
  // ------

  t.is(await controller.y, 60)
  el.stage.state.y = 80
  await el.stage.pendingDone()
  t.is(await controller.y, 80)
  await t.utils.untilRepaint()
  t.is(el.style.translate, "100px 80px")

  t.is(await controller.width, 350)
  el.stage.state.w = 300
  await el.stage.pendingDone()
  t.is(await controller.width, 300)
  await t.utils.untilRepaint()
  t.is(el.style.width, "300px")

  const promise = controller.once("close")

  t.eq(await controller.close(), { y: 80, w: 300 })
  t.eq(await promise, {
    ok: false,
    data: { y: 80, w: 300 },
    opener: "openerInput",
  })
})

test.ui.skip("dialog state", async (t) => {
  await t.glovebox({
    href,
    iframe: true,
    top: true,
    makeContent() {
      return {
        content: [
          { tag: "button", content: "{{cnt}}++", click: "{{cnt++}}" },
          {
            tag: "button#dialog",
            content: "Open Dialog",
            dialog: {
              label: "Live Dialog",
              animate: { transform: "translateY(-100%)", opacity: 0 },
              content: [
                {
                  tag: ".box-h.ctrl-group.w-ctrl",
                  content: [
                    {
                      tag: "number",
                      bind: "x",
                      compact: true,
                    },
                    {
                      tag: "number",
                      bind: "y",
                      compact: true,
                    },
                  ],
                },
                {
                  tag: "number",
                  bind: "cnt",
                  compact: true,
                },
                {
                  tag: "button",
                  content: "{{cnt}}++",
                  click: "{{cnt++}}",
                },
              ],
            },
          },
        ],
        state: {
          cnt: 42,
        },
      }
    },
  })

  document.querySelector("button#dialog")?.click()
  t.pass()
})
