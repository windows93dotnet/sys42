import test from "../../../../42/test.js"
import automaton from "../../../../42/core/dev/automaton.js"
import keyboard from "../../../../42/core/devices/keyboard.js"

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

  const promise = automaton
    .keydown({ key: "Control", code: "ControlLeft" })
    .keydown({ key: "Enter", code: "Enter" })
    .done()

  t.alike(keyboard.keys, { Control: true, Enter: true })

  await promise

  t.alike(keyboard.keys, {})
})
