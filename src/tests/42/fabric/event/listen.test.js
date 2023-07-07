import test from "../../../../42/test.js"
import { normalizeListen } from "../../../../42/fabric/event/listen.js"

const { task, PLACEHOLDER } = test

const el = test.utils.dest({ tag: "button#listen-test", connect: true })

test.tasks(
  [
    task({
      args: [],
      expected: [{ el: globalThis, selector: undefined, listeners: [] }],
      // expected: [],
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
      args: ["button#listen-test", { click() {} }],
      expected: [
        {
          el,
          selector: "button#listen-test",
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

    task({
      args: [{ focus() {} }, el, { click() {} }],
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
      args: [{ focus() {}, blur() {} }, el, { click() {}, keydown() {} }],
      expected: [
        {
          el: globalThis,
          selector: undefined,
          listeners: [
            {
              events: { focus: PLACEHOLDER, blur: PLACEHOLDER },
              options: { signal: PLACEHOLDER },
            },
          ],
        },
        {
          el,
          selector: undefined,
          listeners: [
            {
              events: { click: PLACEHOLDER, keydown: PLACEHOLDER },
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
  },
)
