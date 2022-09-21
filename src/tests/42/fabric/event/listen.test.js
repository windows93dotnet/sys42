import test from "../../../../42/test.js"
import { normalizeListen } from "../../../../42/fabric/event/listen.js"

const { task, PLACEHOLDER } = test

const el = test.utils.dest({ tag: "button", connect: true })

test.tasks(
  [
    task({
      args: [],
      expected: [{ el: globalThis, selector: undefined, listeners: [] }],
    }),

    task({
      args: [el],
      expected: [{ el, selector: undefined, listeners: [] }],
    }),

    task({
      args: [el, { click() {} }],
      expected: [
        {
          el,
          selector: undefined,
          listeners: [
            {
              events: { click: PLACEHOLDER },
              options: { signal: PLACEHOLDER },
            },
          ],
        },
      ],
    }),

    task({
      args: ["button", { click() {} }],
      expected: [
        {
          el,
          selector: "button",
          listeners: [
            {
              events: { click: PLACEHOLDER },
              options: { signal: PLACEHOLDER },
            },
          ],
        },
      ],
    }),

    task({
      args: [{ focus() {} }],
      expected: [
        {
          el: globalThis,
          selector: undefined,
          listeners: [
            {
              events: { focus: PLACEHOLDER },
              options: { signal: PLACEHOLDER },
            },
          ],
        },
      ],
    }),
  ],

  (test, { args, expected }) => {
    test(args, (t) => {
      t.eq(normalizeListen(args).list, expected)
    })
  }
)
