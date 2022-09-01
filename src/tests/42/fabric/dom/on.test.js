import test from "../../../../42/test.js"
import { parseShortcut } from "../../../../42/fabric/dom/on.js"

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
      expected: [
        [
          [
            { event: "keydown", key: "Control", code: "Control" },
            { event: "click" },
          ],
        ],
      ],
    }),
    task({
      actual: "Control+p",
      expected: [
        [
          [
            { event: "keydown", key: "Control", code: "Control" },
            { event: "keydown", key: "p" },
          ],
        ],
      ],
    }),
    task({
      actual: "Control+click Control+p",
      expected: [
        [
          [
            { event: "keydown", key: "Control", code: "Control" },
            { event: "click" },
          ],
          [
            { event: "keydown", key: "Control", code: "Control" },
            { event: "keydown", key: "p" },
          ],
        ],
      ],
    }),
    task({
      actual: "Control+click Control+p || PrintScreen",
      expected: [
        [
          [
            { event: "keydown", key: "Control", code: "Control" },
            { event: "click" },
          ],
          [
            { event: "keydown", key: "Control", code: "Control" },
            { event: "keydown", key: "p" },
          ],
        ],
        [, [{ event: "keydown", key: "PrintScreen", code: "PrintScreen" }]],
      ],
    }),
    task({
      actual: "Ctrl++",
      expected: [
        [
          [
            { event: "keydown", key: "Control", code: "Control" },
            { event: "keydown", key: "+" },
          ],
        ],
      ],
    }),
    task({
      actual: "Ctrl++ Ctrl+-",
      expected: [
        [
          [
            { event: "keydown", key: "Control", code: "Control" },
            { event: "keydown", key: "+" },
          ],
          [
            { event: "keydown", key: "Control", code: "Control" },
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
