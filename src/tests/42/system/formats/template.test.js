/* eslint-disable no-useless-concat */
import test from "../../../../42/test.js"

import template from "../../../../42/system/formats/template.js"

const uppercase = (str) => str.toUpperCase()

test.tasks(
  [
    {
      source: "a b c",
      data: [],
      parsed: { strings: ["a b c"], substitutions: [] },
    },

    {
      source: "a {b c",
      data: [],
      parsed: { strings: ["a {b c"], substitutions: [] },
    },

    {
      source: "a {" + "{b c",
      data: [],
      parsed: { strings: ["a {" + "{b c"], substitutions: [] },
    },

    {
      source: "a {" + "{b} c",
      data: [],
      parsed: { strings: ["a {" + "{b} c"], substitutions: [] },
    },

    {
      source: "a {" + "{b}",
      data: [],
      parsed: { strings: ["a {" + "{b}"], substitutions: [] },
    },

    {
      source: "a {{x}}",
      data: { x: "b" },
      parsed: {
        strings: ["a ", ""],
        substitutions: [[{ type: "key", value: "x" }]],
      },
      expected: "a b",
    },

    {
      title: "missing data",
      source: "a {{x}}",
      parsed: {
        strings: ["a ", ""],
        substitutions: [[{ type: "key", value: "x" }]],
      },
      expected: "a ",
    },

    {
      source: 'a {{"b"}}',
      substitutions: [[{ type: "arg", value: "b" }]],
      expected: "a b",
    },

    {
      source: "{{x}} b",
      data: { x: "a" },
      parsed: {
        strings: ["", " b"],
        substitutions: [[{ type: "key", value: "x" }]],
      },
      expected: "a b",
    },

    {
      source: "a {{0}}",
      data: {},
      expected: "a 0",
    },
    {
      title: "ignore numeric arg when data is an array",
      source: "a {{0}}",
      data: [],
      expected: "a ",
    },

    {
      source: "a {{0}} b {{1}}",
      data: ["x", "y"],
      parsed: {
        strings: ["a ", " b ", ""],
        substitutions: [
          [{ type: "arg", value: 0 }],
          [{ type: "arg", value: 1 }],
        ],
      },
      expected: "a x b y",
    },
    {
      source: "a {{1}} b {{0}}",
      data: ["x", "y"],
      expected: "a y b x",
    },
    {
      source: "a {{x}} b {{0}}",
      data: ["x", "y"],
      expected: "a  b x",
    },

    {
      source: "a {{nested.x}} b {{y}}",
      data: { nested: { x: "x" }, y: "y" },
      expected: "a x b y",
    },
    {
      source: ["a {cyan {{x}}}", "a {cyan {{ x }}}"],
      data: { x: "b" },
      expected: "a {cyan b}",
    },

    {
      source: "a {{x()}}",
      filters: {
        x: () => "b",
      },
      parsed: {
        strings: ["a ", ""],
        substitutions: [
          [{ type: "function", value: "x" }, { type: "functionEnd" }],
        ],
      },
      expected: "a b",
    },

    {
      source: ["a {{x|uppercase}}", "a {{ x | uppercase }}"],
      data: { x: "b" },
      filters: {
        uppercase,
      },
      parsed: {
        strings: ["a ", ""],
        substitutions: [
          [
            { type: "key", value: "x" },
            { type: "pipe" },
            { type: "function", value: "uppercase" },
            { type: "functionEnd" },
          ],
        ],
      },
      expected: "a B",
    },

    {
      source: 'a {{ "b" | uppercase }}',
      data: { x: "b" },
      filters: { uppercase },
      expected: "a B",
    },

    {
      source: ["a {{uppercase(x)}}", "a {{uppercase('b')}}"],
      data: { x: "b" },
      filters: { uppercase },
      expected: "a B",
    },

    {
      source: ["a {{uppercase(x)|double}}"],
      data: { x: "b" },
      filters: {
        uppercase,
        double: (str) => str + str,
      },
      expected: "a BB",
    },

    {
      source: ["a {{uppercase('x\\'x')}}"],
      data: { x: "b" },
      filters: { uppercase },
      expected: "a X'X",
    },

    {
      source: ["a {{foo\\|bar}}"],
      data: { "foo|bar": "b" },
      expected: "a b",
    },

    {
      source: ["a {{x|add(y)}}", "a {{x|add(2)}}", "a {{1|add(2)}}"],
      data: { x: 1, y: 2 },
      filters: {
        add: (a, b) => a + b,
      },
      expected: "a 3",
    },

    {
      source: [
        "a {{x|add(y)|binary}}",
        "a {{ x | add(y) | binary }}",
        "a {{ x | add ( y )  | binary }}",
        "a {{ binary(3) }}",
      ],
      data: { x: 1, y: 2 },
      filters: {
        add: (a, b) => a + b,
        binary: (a) => `0b${a.toString(2).padStart(4, "0")}`,
      },
      expected: "a 0b0011",
    },

    {
      source: "a {{foo ? x : y}}",
      data: { x: "b", y: "c", foo: true },
      parsed: {
        strings: ["a ", ""],
        substitutions: [
          [
            { type: "ternary" },
            { type: "key", value: "foo" },
            { type: "key", value: "x" },
            { type: "key", value: "y" },
          ],
        ],
      },
      expected: "a b",
    },

    {
      title: "truthy value",
      source: ["a {{foo ? x : y}}"],
      data: { x: "b", y: "c", foo: "foo" },
      expected: "a b",
    },

    {
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
      filters: { x: () => "b", y: () => "c", foo: () => true },
      expected: "a b",
    },

    {
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
      filters: { x: () => "b", y: () => "c", foo: () => false },
      expected: "a c",
    },

    // {
    //   source: "{{!a}}",
    //   parsed: {},
    // },

    {
      source: "{{a > 1}}",
      data: { a: 2, b: "b", c: "c" },
      expected: "true",
    },

    {
      source: "{{a > 1 ? b : c}}",
      data: { a: 2, b: "b", c: "c" },
      expected: "b",
    },

    {
      source: [
        "{{a > 1 ? b : c}}", //
        '{{a > 1 ? "b" : "c"}}', //
        '{{0 > 1 ? "b" : "c"}}', //
        "{{a() > 1 ? b : c}}",
        "{{a() > one() ? b : c}}",
      ],
      data: { a: 0, b: "b", c: "c" },
      filters: { a: () => 0, one: () => 1, b: () => "b", c: () => "c" },
      expected: "c",
    },

    {
      only: true,
      source: ["{{a() > one() ? b : c}}"],
      parsed: {},
      // data: { a: 0, b: "b", c: "c" },
      // filters: { a: () => 0, one: () => 1, b: () => "b", c: () => "c" },
      // expected: "c",
    },
  ],

  ({ title, source, data, parsed, filters, expected }) => {
    for (const str of test.utils.arrify(source)) {
      test(str, title, (t) => {
        if (parsed) {
          const p = template.parse(str)

          if (expected) {
            t.is(template.format(p, data, filters), expected)
          }

          t.eq(p, parsed)
        }

        if (expected) {
          t.is(template.render(str, data, filters), expected)
        }
      })
    }
  }
)
