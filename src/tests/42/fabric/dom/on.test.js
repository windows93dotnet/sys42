import test, { suite } from "../../../../42/test.js"
import on, { parseShortcut } from "../../../../42/fabric/dom/on.js"

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
      expected: [[[{ event: "keydown", key: "Control" }, { event: "click" }]]],
    }),
    task({
      actual: "Control+p",
      expected: [
        [
          [
            { event: "keydown", key: "Control" },
            { event: "keydown", key: "p" },
          ],
        ],
      ],
    }),
    task({
      actual: "Control+click Control+p",
      expected: [
        [
          [{ event: "keydown", key: "Control" }, { event: "click" }],
          [
            { event: "keydown", key: "Control" },
            { event: "keydown", key: "p" },
          ],
        ],
      ],
    }),
    task({
      actual: "Control+click Control+p || PrintScreen",
      expected: [
        [
          [{ event: "keydown", key: "Control" }, { event: "click" }],
          [
            { event: "keydown", key: "Control" },
            { event: "keydown", key: "p" },
          ],
        ],
        [, [{ event: "keydown", key: "PrintScreen" }]],
      ],
    }),
    task({
      actual: "Ctrl++",
      expected: [
        [
          [
            { event: "keydown", key: "Control" },
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
            { event: "keydown", key: "Control" },
            { event: "keydown", key: "+" },
          ],
          [
            { event: "keydown", key: "Control" },
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
      expected: [[[{ event: "keydown", key: "Enter" }]]],
    }),
    task({
      actual: "NumpadEnter",
      expected: [[[{ event: "keydown", code: "NumpadEnter" }]]],
    }),
    task({
      actual: "Return",
      expected: [[[{ event: "keydown", key: "Enter", code: "Enter" }]]],
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
  suite.tests({ serial: true })

  const dest = globalThis

  test("Ctrl+click", async (t) => {
    const stub = t.stub()

    on(dest, {
      "Ctrl+click": stub,
    })

    const bot = t.automaton(dest)

    await bot.keystroke({ key: "Control", code: "ControlLeft" })

    t.eq(stub.count, 0)

    bot.click()

    t.eq(stub.count, 0)

    await bot
      .keydown({ key: "Control", code: "ControlLeft" }) //
      .click()

    t.eq(stub.count, 1)
  })
})
