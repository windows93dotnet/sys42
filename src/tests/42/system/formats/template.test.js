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
      parsed: { strings: ["a ", ""], substitutions: ["x"] },
      expected: "a b",
    },
    {
      source: 'a {{"b"}}',
      parsed: { strings: ["a ", ""], substitutions: ['"b"'] },
      expected: "a b",
    },
    {
      source: "{{x}} b",
      data: { x: "a" },
      parsed: { strings: ["", " b"], substitutions: ["x"] },
      expected: "a b",
    },
    {
      source: "a {{0}} b {{1}}",
      data: ["x", "y"],
      parsed: { strings: ["a ", " b ", ""], substitutions: ["0", "1"] },
      expected: "a x b y",
    },
    {
      source: "a {{1}} b {{0}}",
      data: ["x", "y"],
      parsed: { strings: ["a ", " b ", ""], substitutions: ["1", "0"] },
      expected: "a y b x",
    },
    {
      source: "a {{x}} b {{0}}",
      data: ["x", "y"],
      parsed: { strings: ["a ", " b ", ""], substitutions: ["x", "0"] },
      expected: "a  b x",
    },
    {
      source: "a {{nested.x}} b {{y}}",
      data: { nested: { x: "x" }, y: "y" },
      parsed: { strings: ["a ", " b ", ""], substitutions: ["nested.x", "y"] },
      expected: "a x b y",
    },
    {
      source: ["a {cyan {{x}}}", "a {cyan {{ x }}}"],
      data: { x: "b" },
      parsed: { strings: ["a {cyan ", "}"], substitutions: ["x"] },
      expected: "a {cyan b}",
    },
    {
      source: ["a {{foo ? 'b' : 'c'}}"],
      data: { foo: true },
      parsed: {},
      expected: "a b",
    },
    // {
    //   source: ["a {{foo ? 'b' : 'c'}}"],
    //   data: { foo: false },
    //   parsed: {},
    //   expected: "a c",
    // },
    {
      source: [
        "a {{x|uppercase}}",
        "a {{ x | uppercase }}",
        'a {{ "b" | uppercase }}',
      ],
      data: { x: "b" },
      filters: { uppercase },
      expected: "a B",
    },
    {
      source: [
        "a {{uppercase(x)}}",
        "a {{ uppercase( x ) }}",
        "a {{ uppercase ( x ) }}",
      ],
      data: { x: "b" },
      filters: { uppercase },
      parsed: {
        strings: ["a ", ""],
        substitutions: [undefined],
        filters: [[{ name: "uppercase", args: [undefined], locals: { x: 0 } }]],
      },
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
      ],
      data: { x: 1, y: 2 },
      filters: {
        add: (a, b) => a + b,
        binary: (a) => `0b${a.toString(2).padStart(4, "0")}`,
      },
      parsed: {
        strings: ["a ", ""],
        substitutions: ["x"],
        filters: [
          [
            { name: "add", args: [undefined], locals: { y: 0 } },
            { name: "binary", args: [], locals: {} },
          ],
        ],
      },
      expected: "a 0b0011",
    },

    // Don't parse numeric substitutions when data is an array
    {
      source: "a {{0}}",
      data: [],
      parsed: { strings: ["a ", ""], substitutions: ["0"] },
      expected: "a ",
    },
    {
      source: "a {{0}}",
      data: {},
      parsed: { strings: ["a ", ""], substitutions: ["0"] },
      expected: "a 0",
    },
  ],

  ({ source, data, parsed, filters, expected }) => {
    for (const str of test.utils.arrify(source)) {
      test(str, (t) => {
        if (parsed) {
          const p = template.parse(str)
          if (filters === undefined) delete p.filters
          t.eq(p, parsed)

          if (expected) {
            t.is(template.format(p, data, filters), expected)
          }
        }

        if (expected) {
          t.is(template.render(str, data, filters), expected)
        }
      })
    }
  }
)

test("template", (t) => {
  const render = template("{{a}} b")
  t.is(render({ a: "x" }), "x b")
  t.is(template.render("{{a}} b", { a: "a" }), "a b")
})

test("template tag", (t) => {
  t.is(template.make`${"a"} b`, "{{0}} b")
  t.is(template.render(template.make`${"a"} b`, ["x"]), "x b")
})
