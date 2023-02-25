import test, { suite } from "../../../../42/test.js"
import on, { parseShortcut } from "../../../../42/fabric/event/on.js"

const { task } = test

test.tasks(
  [
    task({
      title: "single event",
      actual: "click",
      expected: [[[{ event: "click" }]]],
    }),
    task({
      title: "sequence event",
      actual: "click click",
      expected: [[[{ event: "click" }], [{ event: "click" }]]],
    }),
    task({
      title: "choord event",
      actual: "click+click",
      expected: [[[{ event: "click" }, { event: "click" }]]],
    }),
    task({
      title: "or event",
      actual: ["click||focus", "click || focus", "click  ||  focus"],
      expected: [[[{ event: "click" }]], [[{ event: "focus" }]]],
    }),
    task({
      actual: "Ctrl+click",
      expected: [[[{ event: "keydown", key: "control" }, { event: "click" }]]],
    }),
    task({
      actual: "Control+p",
      expected: [
        [
          [
            { event: "keydown", key: "control" },
            { event: "keydown", key: "p" },
          ],
        ],
      ],
    }),
    task({
      actual: "Control+click Control+p",
      expected: [
        [
          [{ event: "keydown", key: "control" }, { event: "click" }],
          [
            { event: "keydown", key: "control" },
            { event: "keydown", key: "p" },
          ],
        ],
      ],
    }),
    task({
      actual: "Control+click Control+p || PrintScreen",
      expected: [
        [
          [{ event: "keydown", key: "control" }, { event: "click" }],
          [
            { event: "keydown", key: "control" },
            { event: "keydown", key: "p" },
          ],
        ],
        [, [{ event: "keydown", key: "printscreen" }]],
      ],
    }),
    task({
      actual: "Ctrl++",
      expected: [
        [
          [
            { event: "keydown", key: "control" },
            { event: "keydown", key: "+" },
          ],
        ],
      ],
    }),
    task({
      actual: "+",
      expected: [[[{ event: "keydown", key: "+" }]]],
    }),
    task({
      actual: "-",
      expected: [[[{ event: "keydown", key: "-" }]]],
    }),
    task({
      actual: "Ctrl++ Ctrl+-",
      expected: [
        [
          [
            { event: "keydown", key: "control" },
            { event: "keydown", key: "+" },
          ],
          [
            { event: "keydown", key: "control" },
            { event: "keydown", key: "-" },
          ],
        ],
      ],
    }),
    task({
      actual: "ControlLeft+KeyP+Digit1+NumpadEnter",
      expected: [
        [
          [
            { event: "keydown", code: "ControlLeft" },
            { event: "keydown", code: "KeyP" },
            { event: "keydown", code: "Digit1" },
            { event: "keydown", code: "NumpadEnter" },
          ],
        ],
      ],
    }),
    task({
      actual: "Enter",
      expected: [[[{ event: "keydown", key: "enter" }]]],
    }),
    task({
      actual: "NumpadEnter",
      expected: [[[{ event: "keydown", code: "NumpadEnter" }]]],
    }),
    task({
      actual: "Return",
      expected: [[[{ event: "keydown", key: "enter", code: "Enter" }]]],
    }),
  ],
  (test, { title, actual, expected }) => {
    test("parseShortcut", title ?? actual, (t) => {
      for (const item of test.utils.arrify(actual)) {
        t.eq(parseShortcut(item), expected, item)
      }
    })
  }
)

suite.serial("globalThis", () => {
  suite.timeout(1000)
  suite.tests({ serial: true })

  const dest = globalThis

  test("Ctrl+click", async (t, { decay }) => {
    const stub = t.stub()

    decay(
      on(dest, {
        "Ctrl+click": stub,
      })
    )

    const bot = t.puppet(dest)

    await bot.keystroke({ key: "Control", code: "ControlLeft" })

    t.eq(stub.count, 0)

    await bot.click()

    t.eq(stub.count, 0)

    await bot
      .keydown({ key: "Control", code: "ControlLeft" }) //
      .click()

    t.eq(stub.count, 1)
  })

  test("Ctrl+click & click", async (t, { decay }) => {
    const a = t.stub()
    const b = t.stub()

    decay(
      on(dest, {
        "Ctrl+click": a,
        "click": b,
      })
    )

    const bot = t.puppet(dest)

    t.eq([a.count, b.count], [0, 0])

    await bot.click()
    t.eq([a.count, b.count], [0, 1])

    await bot.keydown({ key: "Control", code: "ControlLeft" }).click().keyup()
    t.eq([a.count, b.count], [1, 1])

    await bot.click()
    t.eq([a.count, b.count], [1, 2])

    await bot.keystroke({ key: "Control", code: "ControlLeft" })
    t.eq([a.count, b.count], [1, 2])

    await bot.click()
    t.eq([a.count, b.count], [1, 3])

    await bot.keydown({ key: "Control", code: "ControlLeft" }).click().keyup()
    t.eq([a.count, b.count], [2, 3])
  })

  test("a a", async (t, { decay }) => {
    const stub = t.stub()

    decay(
      on(dest, {
        "a a": stub,
      })
    )

    const bot = t.puppet(dest)

    await bot.keystroke({ key: "a", code: "KeyA" })
    t.eq(stub.count, 0)

    await bot.keystroke({ key: "a", code: "KeyA" })
    t.eq(stub.count, 1)

    /*  */

    await bot.keystroke({ key: "a", code: "KeyA" })
    t.eq(stub.count, 1)

    await bot.keystroke({ key: "b", code: "KeyB" }) // reset seqIndex
    t.eq(stub.count, 1)

    await bot.keystroke({ key: "a", code: "KeyA" })
    t.eq(stub.count, 1)

    await bot.keystroke({ key: "a", code: "KeyA" })
    t.eq(stub.count, 2)
  })

  test("click click", async (t, { decay }) => {
    const stub = t.stub()

    decay(
      on(dest, {
        "click click": stub,
      })
    )

    const bot = t.puppet(dest)

    await bot.click()
    t.eq(stub.count, 0)

    await bot.click()
    t.eq(stub.count, 1)

    await bot.click()
    t.eq(stub.count, 1)

    await bot.click()
    t.eq(stub.count, 2)
  })
})
