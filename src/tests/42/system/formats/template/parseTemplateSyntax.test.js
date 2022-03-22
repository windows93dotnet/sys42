import test from "../../../../../42/test.js"

import parseTemplateSyntax from "../../../../../42/system/formats/template/parseTemplateSyntax.js"

test.tasks(
  [
    {
      source: "a",
      parsed: [{ type: "key", buffer: "a" }],
    },
    {
      source: ["a.b", " a.b "],
      parsed: [{ type: "key", buffer: "a.b" }],
    },
    {
      source: "a()",
      parsed: [{ type: "function", buffer: "a" }, { type: "functionEnd" }],
    },
    {
      source: "a([1])",
      parsed: [
        { type: "function", buffer: "a" },
        { type: "arg", buffer: [1] },
        { type: "functionEnd" },
      ],
    },
    {
      source: "a(x)",
      parsed: [
        { type: "function", buffer: "a" },
        { type: "key", buffer: "x" },
        { type: "functionEnd" },
      ],
    },
    {
      source: 'a(x,y,1,"z",z)',
      parsed: [
        { type: "function", buffer: "a" },
        { type: "key", buffer: "x" },
        { type: "key", buffer: "y" },
        { type: "arg", buffer: 1 },
        { type: "arg", buffer: "z" },
        { type: "key", buffer: "z" },
        { type: "functionEnd" },
      ],
    },
    {
      source: ["a([1],2)", "a([1], 2)", " a ( [ 1 ] , 2 ) "],
      parsed: [
        { type: "function", buffer: "a" },
        { type: "arg", buffer: [1] },
        { type: "arg", buffer: 2 },
        { type: "functionEnd" },
      ],
    },
    {
      source: ['a("[1],2")'],
      parsed: [
        { type: "function", buffer: "a" },
        { type: "arg", buffer: "[1],2" },
        { type: "functionEnd" },
      ],
    },
    {
      source: ['"[1],2"'],
      parsed: [{ type: "arg", buffer: "[1],2" }],
    },
    {
      source: "a|filter",
      parsed: [
        { type: "key", buffer: "a" },
        { type: "pipe" },
        { type: "key", buffer: "filter" },
      ],
    },
    {
      source: "a|filter1|filter2",
      parsed: [
        { type: "key", buffer: "a" },
        { type: "pipe" },
        { type: "key", buffer: "filter1" },
        { type: "pipe" },
        { type: "key", buffer: "filter2" },
      ],
    },
    {
      source: "a|filter(b)",
      parsed: [
        { type: "key", buffer: "a" },
        { type: "pipe" },
        { type: "function", buffer: "filter" },
        { type: "key", buffer: "b" },
        { type: "functionEnd" },
      ],
    },
    {
      source: "a|filter(b)|filter2",
      parsed: [
        { type: "key", buffer: "a" },
        { type: "pipe" },
        { type: "function", buffer: "filter" },
        { type: "key", buffer: "b" },
        { type: "functionEnd" },
        { type: "pipe" },
        { type: "key", buffer: "filter2" },
      ],
    },
    {
      source: ["a?b:c", " a ? b : c "],
      parsed: [
        { type: "ternary" },
        { type: "key", buffer: "a" },
        { type: "key", buffer: "b" },
        { type: "key", buffer: "c" },
      ],
    },
    {
      source: 'a?"b":"c"',
      parsed: [
        { type: "ternary" },
        { type: "key", buffer: "a" },
        { type: "arg", buffer: "b" },
        { type: "arg", buffer: "c" },
      ],
    },
    {
      source: 'a?"?":":"',
      parsed: [
        { type: "ternary" },
        { type: "key", buffer: "a" },
        { type: "arg", buffer: "?" },
        { type: "arg", buffer: ":" },
      ],
    },
    {
      source: "a(1) ? 2 : 3",
      parsed: [
        { type: "ternary" },
        { type: "function", buffer: "a" },
        { type: "arg", buffer: 1 },
        { type: "functionEnd" },
        { type: "key", buffer: "2" },
        { type: "key", buffer: "3" },
      ],
    },
    {
      source: "a(1,x) ? b(2) : c(3)",
      parsed: [
        { type: "ternary" },
        { type: "function", buffer: "a" },
        { type: "arg", buffer: 1 },
        { type: "key", buffer: "x" },
        { type: "functionEnd" },
        { type: "function", buffer: "b" },
        { type: "arg", buffer: 2 },
        { type: "functionEnd" },
        { type: "function", buffer: "c" },
        { type: "arg", buffer: 3 },
        { type: "functionEnd" },
      ],
    },
  ],

  ({ source, parsed }) => {
    for (const str of test.utils.arrify(source)) {
      test(str, (t) => {
        const actual = parseTemplateSyntax(str).map((x) => {
          delete x.pos
          return x
        })
        t.eq(actual, parsed)
      })
    }
  }
)
