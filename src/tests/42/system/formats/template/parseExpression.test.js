import test from "../../../../../42/test.js"

import parseExpression from "../../../../../42/system/formats/template/parseExpression.js"

test.tasks(
  [
    {
      source: "0",
      parsed: [{ type: "arg", value: 0 }],
    },
    {
      source: "a",
      parsed: [{ type: "key", value: "a" }],
    },
    {
      source: ["a.b", " a.b "],
      parsed: [{ type: "key", value: "a.b" }],
    },
    {
      source: "a()",
      parsed: [{ type: "function", value: "a" }, { type: "functionEnd" }],
    },
    {
      source: "a([1])",
      parsed: [
        { type: "function", value: "a" },
        { type: "arg", value: [1] },
        { type: "functionEnd" },
      ],
    },
    {
      source: "a(x)",
      parsed: [
        { type: "function", value: "a" },
        { type: "key", value: "x" },
        { type: "functionEnd" },
      ],
    },
    {
      source: 'a(")")',
      parsed: [
        { type: "function", value: "a" },
        { type: "arg", value: ")" },
        { type: "functionEnd" },
      ],
    },
    {
      source: '"a()"',
      parsed: [{ type: "arg", value: "a()" }],
    },
    {
      source: 'a(x,y,1,"z",z)',
      parsed: [
        { type: "function", value: "a" },
        { type: "key", value: "x" },
        { type: "key", value: "y" },
        { type: "arg", value: 1 },
        { type: "arg", value: "z" },
        { type: "key", value: "z" },
        { type: "functionEnd" },
      ],
    },
    {
      source: ["a([1],2)", "a([1], 2)", " a ( [ 1 ] , 2 ) "],
      parsed: [
        { type: "function", value: "a" },
        { type: "arg", value: [1] },
        { type: "arg", value: 2 },
        { type: "functionEnd" },
      ],
    },
    {
      source: ['a("[1],2")'],
      parsed: [
        { type: "function", value: "a" },
        { type: "arg", value: "[1],2" },
        { type: "functionEnd" },
      ],
    },
    {
      source: ['"[1],2"'],
      parsed: [{ type: "arg", value: "[1],2" }],
    },
    {
      source: "a|filter",
      parsed: [
        { type: "key", value: "a" },
        { type: "pipe" },
        { type: "function", value: "filter" },
        { type: "functionEnd" },
      ],
    },
    {
      source: "a|filter1|filter2",
      parsed: [
        { type: "key", value: "a" },
        { type: "pipe" },
        { type: "function", value: "filter1" },
        { type: "functionEnd" },
        { type: "pipe" },
        { type: "function", value: "filter2" },
        { type: "functionEnd" },
      ],
    },
    {
      source: "a|filter(b)",
      parsed: [
        { type: "key", value: "a" },
        { type: "pipe" },
        { type: "function", value: "filter" },
        { type: "key", value: "b" },
        { type: "functionEnd" },
      ],
    },
    {
      source: "a|filter(b)|filter2",
      parsed: [
        { type: "key", value: "a" },
        { type: "pipe" },
        { type: "function", value: "filter" },
        { type: "key", value: "b" },
        { type: "functionEnd" },
        { type: "pipe" },
        { type: "function", value: "filter2" },
        { type: "functionEnd" },
      ],
    },
    {
      source: ["a?b:c", " a ? b : c "],
      parsed: [
        { type: "key", value: "a" },
        { type: "ternary", value: true },
        { type: "key", value: "b" },
        { type: "ternary", value: false },
        { type: "key", value: "c" },
      ],
    },
    {
      source: 'a?"b":"c"',
      parsed: [
        { type: "key", value: "a" },
        { type: "ternary", value: true },
        { type: "arg", value: "b" },
        { type: "ternary", value: false },
        { type: "arg", value: "c" },
      ],
    },
    {
      source: '"a"?"b":"c"',
      parsed: [
        { type: "arg", value: "a" },
        { type: "ternary", value: true },
        { type: "arg", value: "b" },
        { type: "ternary", value: false },
        { type: "arg", value: "c" },
      ],
    },
    {
      source: 'a?"?":":"',
      parsed: [
        { type: "key", value: "a" },
        { type: "ternary", value: true },
        { type: "arg", value: "?" },
        { type: "ternary", value: false },
        { type: "arg", value: ":" },
      ],
    },
    {
      source: "a(1) ? 2 : 3",
      parsed: [
        { type: "function", value: "a" },
        { type: "arg", value: 1 },
        { type: "functionEnd" },
        { type: "ternary", value: true },
        { type: "arg", value: 2 },
        { type: "ternary", value: false },
        { type: "arg", value: 3 },
      ],
    },
    {
      source: "a(1,x) ? b(2) : c(3)",
      parsed: [
        { type: "function", value: "a" },
        { type: "arg", value: 1 },
        { type: "key", value: "x" },
        { type: "functionEnd" },
        { type: "ternary", value: true },
        { type: "function", value: "b" },
        { type: "arg", value: 2 },
        { type: "functionEnd" },
        { type: "ternary", value: false },
        { type: "function", value: "c" },
        { type: "arg", value: 3 },
        { type: "functionEnd" },
      ],
    },
    {
      source: "a > 1 ? true : false",
      parsed: [
        { type: "key", value: "a" },
        { type: "operator", value: ">" },
        { type: "arg", value: 1 },
        { type: "ternary", value: true },
        { type: "arg", value: true },
        { type: "ternary", value: false },
        { type: "arg", value: false },
      ],
    },
    {
      source: "1 && b > 1",
      parsed: [
        { type: "arg", value: 1 },
        { type: "operator", value: "&&" },
        { type: "key", value: "b" },
        { type: "operator", value: ">" },
        { type: "arg", value: 1 },
      ],
    },
    {
      source: "!a || a > 1",
      parsed: [
        { type: "key", value: "a", negated: true },
        { type: "operator", value: "||" },
        { type: "key", value: "a" },
        { type: "operator", value: ">" },
        { type: "arg", value: 1 },
      ],
    },
    {
      source: "a | b(!a || a > 1) ? c : d",
      parsed: [
        { type: "key", value: "a" },
        { type: "pipe" },
        { type: "function", value: "b" },
        { type: "key", value: "a", negated: true },
        { type: "operator", value: "||" },
        { type: "key", value: "a" },
        { type: "operator", value: ">" },
        { type: "arg", value: 1 },
        { type: "functionEnd" },
        { type: "ternary", value: true },
        { type: "key", value: "c" },
        { type: "ternary", value: false },
        { type: "key", value: "d" },
      ],
    },
    {
      source: "a() > one() ? b : c",
      parsed: [
        { type: "function", value: "a" },
        { type: "functionEnd" },
        { type: "operator", value: ">" },
        { type: "function", value: "one" },
        { type: "functionEnd" },
        { type: "ternary", value: true },
        { type: "key", value: "b" },
        { type: "ternary", value: false },
        { type: "key", value: "c" },
      ],
    },
    {
      source: "foo(1, a)",
      parsed: [
        { type: "function", value: "foo" },
        { type: "arg", value: 1 },
        { type: "key", value: "a" },
        { type: "functionEnd" },
      ],
    },
    {
      source: "foo(a, 1)",
      parsed: [
        { type: "function", value: "foo" },
        { type: "key", value: "a" },
        { type: "arg", value: 1 },
        { type: "functionEnd" },
      ],
    },
  ],

  ({ source, parsed }) => {
    for (const str of test.utils.arrify(source)) {
      test(str, (t) => {
        const actual = parseExpression(str).map((x) => {
          delete x.pos
          return x
        })
        t.eq(actual, parsed)
      })
    }
  }
)
