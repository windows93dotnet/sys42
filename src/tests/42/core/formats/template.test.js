/* eslint-disable no-useless-concat */
import test from "../../../../42/test.js"
import template from "../../../../42/core/formats/template.js"

const uppercase = (str) => str.toUpperCase()

async function uppercaseAsync(str) {
  await test.utils.sleep(10)
  return str.toUpperCase()
}

const { task } = test

test.tasks(
  [
    task({
      source: "a b c",
      data: [],
      parsed: { strings: ["a b c"], substitutions: [] },
    }),

    task({
      source: "a {b c",
      data: [],
      parsed: { strings: ["a {b c"], substitutions: [] },
    }),

    task({
      source: "a {" + "{b c",
      data: [],
      parsed: { strings: ["a {" + "{b c"], substitutions: [] },
    }),

    task({
      source: "a {" + "{b} c",
      data: [],
      parsed: { strings: ["a {" + "{b} c"], substitutions: [] },
    }),

    task({
      source: "a {" + "{b}",
      data: [],
      parsed: { strings: ["a {" + "{b}"], substitutions: [] },
    }),

    task({
      source: "a {{x}}",
      data: { x: "b" },
      parsed: {
        strings: ["a ", ""],
        substitutions: [[{ type: "key", value: "x" }]],
      },
      expected: "a b",
    }),

    task({
      title: "escaped",
      source: "a \\{{x}}",
      parsed: { strings: ["a {{x}}"], substitutions: [] },
      expected: "a {{x}}",
    }),

    task({
      title: "missing data",
      source: "a {{x}}",
      parsed: {
        strings: ["a ", ""],
        substitutions: [[{ type: "key", value: "x" }]],
      },
      expected: "a ",
    }),

    task({
      source: 'a {{"b"}}',
      substitutions: [[{ type: "arg", value: "b" }]],
      expected: "a b",
    }),

    task({
      source: "{{x}} b",
      data: { x: "a" },
      parsed: {
        strings: ["", " b"],
        substitutions: [[{ type: "key", value: "x" }]],
      },
      expected: "a b",
    }),

    task({
      source: "a {{0}}",
      data: {},
      expected: "a 0",
    }),
    task({
      source: "a {{0}}",
      data: ["b"],
      expected: "a 0",
    }),
    task({
      source: "a {{./0}}",
      data: ["b"],
      expected: "a b",
    }),

    task({
      source: "a {{0}} b {{1}}",
      data: ["x", "y"],
      parsed: {
        strings: ["a ", " b ", ""],
        substitutions: [
          [{ type: "arg", value: 0 }],
          [{ type: "arg", value: 1 }],
        ],
      },
      expected: "a 0 b 1",
    }),
    task({
      source: "a {{./0}} b {{./1}}",
      data: ["x", "y"],
      parsed: {
        strings: ["a ", " b ", ""],
        substitutions: [
          [{ type: "key", value: "0" }],
          [{ type: "key", value: "1" }],
        ],
      },
      expected: "a x b y",
    }),
    task({
      source: "a {{./1}} b {{./0}}",
      data: ["x", "y"],
      expected: "a y b x",
    }),
    task({
      source: "a {{x}} b {{./0}}",
      data: ["x", "y"],
      expected: "a  b x",
    }),

    task({
      source: "a {{nested.x}} b {{y}}",
      data: { nested: { x: "x" }, y: "y" },
      expected: "a x b y",
    }),
    task({
      source: ["a {cyan {{x}}}", "a {cyan {{ x }}}"],
      data: { x: "b" },
      expected: "a {cyan b}",
    }),

    /* actions
    ========== */

    task({
      source: "a {{x()}}",
      actions: {
        x: () => "b",
      },
      parsed: {
        strings: ["a ", ""],
        substitutions: [
          [{ type: "function", value: "x" }, { type: "functionEnd" }],
        ],
      },
      expected: "a b",
    }),

    task({
      source: ["a {{uppercase('x\\'x')}}"],
      data: { x: "b" },
      actions: { uppercase },
      expected: "a X'X",
    }),

    task({
      source: ["a {{x|>uppercase(^^)}}", "a {{ x |> uppercase(^^) }}"],
      data: { x: "b" },
      actions: {
        uppercase,
      },
      parsed: {
        strings: ["a ", ""],
        substitutions: [
          [
            { type: "key", value: "x" },
            { type: "pipe" },
            { type: "function", value: "uppercase" },
            { type: "placeholder" },
            { type: "functionEnd" },
          ],
        ],
      },
      expected: "a B",
    }),

    task({
      source: 'a {{ "b" |> uppercase(^^) }}',
      data: { x: "b" },
      actions: { uppercase },
      expected: "a B",
    }),

    task({
      source: ["a {{uppercase(x)}}", "a {{uppercase('b')}}"],
      data: { x: "b" },
      actions: { uppercase },
      expected: "a B",
    }),

    task({
      source: ["a {{uppercase(x)|>double(^^)}}"],
      data: { x: "b" },
      actions: {
        uppercase,
        double: (str) => str + str,
      },
      expected: "a BB",
    }),

    task({
      source: ["a {{foo\\|\\>bar}}"],
      data: { "foo|>bar": "b" },
      expected: "a b",
    }),

    task({
      source: ["a {{foo(a > 1, a, 1)}}"],
      data: { a: 2 },
      actions: { foo: (...args) => args.join(" - ") },
      expected: "a true - 2 - 1",
    }),

    task({
      source: [
        "a {{x|>add(^^, y)}}",
        "a {{x|>add(^^, 2)}}",
        "a {{1|>add(^^, 2)}}",
      ],
      data: { x: 1, y: 2 },
      actions: {
        add: (a, b) => a + b,
      },
      expected: "a 3",
    }),

    task({
      source: [
        "a {{x|>add(^^, y)|>binary(^^)}}",
        "a {{ x |> add(^^, y) |> binary(^^) }}",
        "a {{ x |> add ( ^^, y )  |> binary(^^) }}",
        "a {{ binary(3) }}",
      ],
      data: { x: 1, y: 2 },
      actions: {
        add: (a, b) => a + b,
        binary: (a) => `0b${a.toString(2).padStart(4, "0")}`,
      },
      expected: "a 0b0011",
    }),

    /* ternary
    ========== */

    task({
      source: "a {{foo ? x : y}}",
      data: { x: "b", y: "c", foo: true },
      parsed: {
        strings: ["a ", ""],
        substitutions: [
          [
            { type: "key", value: "foo" },
            { type: "ternary", value: true },
            { type: "key", value: "x" },
            { type: "ternary", value: false },
            { type: "key", value: "y" },
          ],
        ],
      },
      expected: "a b",
    }),

    task({
      title: "truthy value",
      source: ["a {{foo ? x : y}}"],
      data: { x: "b", y: "c", foo: "foo" },
      expected: "a b",
    }),

    task({
      source: [
        "a {{foo ? x : y}}",
        "a {{foo() ? x() : y()}}",
        'a {{foo ? "b" : y}}',
        'a {{true ? "b" : y}}',
        'a {{1 ? "b" : y}}',
        'a {{"foo" ? "b" : y}}',
        'a {{[] ? "b" : y}}',
      ],
      data: { x: "b", y: "c", foo: true },
      actions: { x: () => "b", y: () => "c", foo: () => true },
      expected: "a b",
    }),

    task({
      source: [
        "a {{foo ? x : y |> uppercase(^^)}}",
        "a {{foo() ? x() : y() |> uppercase(^^)}}",
        'a {{foo ? "b" : y |> uppercase(^^)}}',
        'a {{true ? "b" : y |> uppercase(^^)}}',
        'a {{1 ? "b" : y |> uppercase(^^)}}',
        'a {{"foo" ? "b" : y |> uppercase(^^)}}',
        'a {{[] ? "b" : y |> uppercase(^^)}}',
      ],
      data: { x: "b", y: "c", foo: true },
      actions: { x: () => "b", y: () => "c", foo: () => true, uppercase },
      expected: "a B",
    }),

    task({
      source: [
        "a {{foo ? x : y}}",
        "a {{foo() ? x() : y()}}",
        'a {{foo ? x : "c"}}',
        'a {{false ? x : "c"}}',
        'a {{0 ? x : "c"}}',
        'a {{undefined ? x : "c"}}',
        'a {{"" ? x : "c"}}',
        'a {{NaN ? x : "c"}}',
      ],
      data: { x: "b", y: "c", foo: false },
      actions: { x: () => "b", y: () => "c", foo: () => false },
      expected: "a c",
    }),

    /* operator
    =========== */

    task({
      source: "{{a > 1}}",
      data: { a: 2 },
      title: "true",
      expected: "true",
    }),

    task({
      source: "{{a > 1}}",
      data: { a: 0 },
      title: "false",
      expected: "false",
    }),

    task({
      source: "{{a > 1|>foo(^^)}}",
      data: { a: 2 },
      actions: { foo: (arg) => (arg ? "more" : "less") },
      title: "more",
      expected: "more",
    }),

    task({
      source: "{{a > 1|>foo(^^)}}",
      data: { a: 0 },
      actions: { foo: (arg) => (arg ? "more" : "less") },
      title: "less",
      expected: "less",
    }),

    task({
      source: "{{a > 1 ? b : c}}",
      data: { a: 2, b: "b", c: "c" },
      title: "b",
      expected: "b",
    }),

    task({
      source: [
        "{{a > 1 ? b : c}}", //
        '{{a > 1 ? "b" : "c"}}', //
        '{{0 > 1 ? "b" : "c"}}', //
        "{{a() > 1 ? b : c}}",
        "{{a() > one() ? b : c}}",
      ],
      data: { a: 0, b: "b", c: "c" },
      actions: { a: () => 0, one: () => 1, b: () => "b", c: () => "c" },
      expected: "c",
    }),

    /* negated
    ========== */

    task({
      source: "{{!a}}",
      parsed: {
        strings: ["", ""],
        substitutions: [[{ type: "key", value: "a", negated: true }]],
      },
      expected: "true",
    }),

    task({
      source: ['{{!a ? "b" : "c"}}', '{{!0 ? "b" : "c"}}'],
      expected: "b",
    }),

    task({
      source: ['{{!a ? "b" : "c"}}', '{{!1 ? "b" : "c"}}'],
      data: { a: "foo" },
      expected: "c",
    }),

    /* async
    ======== */

    task({
      title: "failing async filter",
      source: ["{{foo()}}"],
      actions: { foo: async () => "foo" },
      expected: "[object Promise]",
    }),

    task({
      source: ["{{foo()}}"],
      actions: { foo: async () => "foo" },
      async: true,
      expected: "foo",
    }),

    task({
      source: ["{{foo()|>uppercaseAsync(^^)}}"],
      actions: {
        foo: async () => "foo",
        uppercaseAsync,
      },
      async: true,
      expected: "FOO",
    }),

    task({
      source: ["{{zero() > one() ? a() : b()|>uppercaseAsync(^^)}}"],
      actions: {
        zero: async () => 0,
        one: async () => 1,
        a: async () => "a",
        b: async () => "b",
        uppercaseAsync,
      },
      async: true,
      expected: "B",
    }),

    task({
      source: ["{{zero() < one() ? a() : b()|>uppercaseAsync(^^)}}"],
      actions: {
        zero: async () => 0,
        one: async () => 1,
        a: async () => "a",
        b: async () => "b",
        uppercaseAsync,
      },
      async: true,
      expected: "A",
    }),
  ],

  (test, { title, source, data, parsed, actions, expected, async }) => {
    const format = async ? "formatAsync" : "format"
    const render = async ? "renderAsync" : "render"
    for (const str of test.utils.arrify(source)) {
      test(str, title, async (t) => {
        if (parsed) {
          const p = template.parse(str)

          if (expected) {
            t.is(await template[format](p, data, actions), expected)
          }

          t.eq(p, parsed)
        }

        if (expected) {
          t.is(await template[render](str, data, actions), expected)
        }
      })
    }
  }
)
