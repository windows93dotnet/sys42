import test from "../../../../42/test.js"
import puppet from "../../../../42/core/dev/puppet.js"
import keyboard from "../../../../42/core/devices/keyboard.js"
import create from "../../../../42/ui/create.js"

test.suite.serial()

const wasListening = keyboard.isListening

test.setup(() => {
  keyboard.listen()
})

test.teardown(() => {
  if (!wasListening) keyboard.forget()
})

test.serial.skip("auto release keys", async (t) => {
  t.alike(keyboard.keys, {})

  await puppet
    .keydown({ key: "Control", code: "ControlLeft" })
    .keydown({ key: "Enter", code: "Enter" })

  t.alike(keyboard.keys, { Control: true, Enter: true })

  await t.utils.untilNextTask()

  t.alike(keyboard.keys, {})
})

test.serial("auto wait for element", async (t) => {
  const stub = t.stub()
  const id = t.utils.uid()
  const el = t.utils.decay(t.utils.invisible(create("button", { id })))
  el.addEventListener("pointerdown", stub)
  el.addEventListener("pointerup", stub)

  const promise = puppet(`#${id}`, { timeout: 100 }) //
    .dispatch("pointerdown")
    .dispatch("pointerup")

  const end = t.sleep(50).then(() => document.body.append(el))

  t.is((await promise)[0], el)
  t.is(stub.count, 2)
  t.eq(
    stub.calls.map(({ args: [e] }) => e.type),
    ["pointerdown", "pointerup"],
  )

  await end
})

test.serial("auto wait for element", "throws on timeout", async (t) => {
  const id = t.utils.uid()
  const el = t.utils.decay(t.utils.invisible(create("button", { id })))

  const promise = puppet(`#${id}`, { timeout: 50 }) //
    .dispatch("pointerdown")
    .dispatch("focus")

  const end = t.sleep(100).then(() => document.body.append(el))

  await t.throws(promise, /timed out/)

  await end
})

test.serial("hover", async (t) => {
  const el = t.utils.dest({ connect: true })
  el.append("hello")
  el.style.border = "1px solid"
  el.style.inset = "20px auto auto 30px"
  el.style.width = "100px"
  el.style.height = "50px"

  const res = []

  const keys = [
    "click",
    "pointerover",
    "mouseover",
    "pointerenter",
    "mouseenter",
    "pointerleave",
    "mouseleave",
    "pointermove",
  ].join("||")

  t.utils.on(el, {
    [keys]({ type, x, y }) {
      res.push({ type, x, y })
    },
  })

  await t
    .puppet(el)
    .hover(() => {
      res.push("before click & leave")
    })
    .click()

  t.eq(res, [
    { type: "pointerover", x: 30, y: 20 },
    { type: "pointerenter", x: 30, y: 20 },
    { type: "mouseover", x: 30, y: 20 },
    { type: "mouseenter", x: 30, y: 20 },
    { type: "pointermove", x: 30, y: 20 },
    { type: "pointermove", x: 80, y: 45 },
    "before click & leave",
    { type: "click", x: 80, y: 45 },
    { type: "pointermove", x: 30, y: 20 },
    { type: "pointerleave", x: 30, y: 20 },
    { type: "mouseleave", x: 30, y: 20 },
  ])
})
