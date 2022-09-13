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

test.serial("auto release keys", async (t) => {
  t.alike(keyboard.keys, {})

  await puppet
    .keydown({ key: "Control", code: "ControlLeft" })
    .keydown({ key: "Enter", code: "Enter" })

  t.alike(keyboard.keys, { Control: true, Enter: true })

  await t.sleep(0)

  t.alike(keyboard.keys, {})
})

test.serial("auto wait for element", async (t) => {
  const stub = t.stub()
  const id = t.utils.uid()
  const el = t.utils.decay(create("button", { id }))
  el.addEventListener("pointerdown", stub)
  el.addEventListener("focus", stub)

  const promise = puppet(`#${id}`, { timeout: 100 }) //
    .dispatch("pointerdown")
    .dispatch("focus")

  t.sleep(50).then(() => document.body.append(el))

  t.is(el, await promise)
  t.is(stub.count, 2)
  t.eq(
    stub.calls.map(({ args: [e] }) => e.type),
    ["pointerdown", "focus"]
  )
})

test.serial("auto wait for element", "throws on timeout", async (t) => {
  const id = t.utils.uid()
  const el = t.utils.decay(create("button", { id }))

  const promise = puppet(`#${id}`, { timeout: 50 }) //
    .dispatch("pointerdown")
    .dispatch("focus")

  t.sleep(100).then(() => document.body.append(el))

  await t.throws(promise, /timed out/)
})
