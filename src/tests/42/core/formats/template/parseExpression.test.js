import test from "../../../../../42/test.js"

import parseExpression from "../../../../../42/core/formats/template/parseExpression.js"

const { task } = test

test.tasks(
  [
    task({
      source: "0",
      parsed: [{ type: "arg", value: 0 }],
    }),
    task({
      source: "-0",
      parsed: [{ type: "arg", value: -0 }],
    }),
    task({
      source: "1",
      parsed: [{ type: "arg", value: 1 }],
    }),
    task({
      source: "-1",
      parsed: [{ type: "arg", value: -1 }],
    }),
    task({
      source: "a",
      parsed: [{ type: "key", value: "a" }],
    }),
    task({
      source: ["a.b", " a.b "],
      parsed: [{ type: "key", value: "a.b" }],
    }),
    task({
      source: "a()",
      parsed: [{ type: "function", value: "a" }, { type: "functionEnd" }],
    }),
    task({
      source: "a([1])",
      parsed: [
        { type: "function", value: "a" },
        { type: "arg", value: [1] },
        { type: "functionEnd" },
      ],
    }),
    task({
      source: "a(x)",
      parsed: [
        { type: "function", value: "a" },
        { type: "key", value: "x" },
        { type: "functionEnd" },
      ],
    }),
    task({
      source: 'a(")")',
      parsed: [
        { type: "function", value: "a" },
        { type: "arg", value: ")" },
        { type: "functionEnd" },
      ],
    }),
    task({
      source: '"a()"',
      parsed: [{ type: "arg", value: "a()" }],
    }),
    task({
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
    }),
    task({
      source: ["a([1],2)", "a([1], 2)", " a ( [ 1 ] , 2 ) "],
      parsed: [
        { type: "function", value: "a" },
        { type: "arg", value: [1] },
        { type: "arg", value: 2 },
        { type: "functionEnd" },
      ],
    }),
    task({
      source: ['a("[1],2")'],
      parsed: [
        { type: "function", value: "a" },
        { type: "arg", value: "[1],2" },
        { type: "functionEnd" },
      ],
    }),
    task({
      source: ['"[1],2"'],
      parsed: [{ type: "arg", value: "[1],2" }],
    }),
    task({
      source: "a|>filter",
      parsed: [
        { type: "key", value: "a" },
        { type: "pipe" },
        { type: "function", value: "filter" },
        { type: "functionEnd" },
      ],
    }),
    task({
      source: "a|>filter1|>filter2",
      parsed: [
        { type: "key", value: "a" },
        { type: "pipe" },
        { type: "function", value: "filter1" },
        { type: "functionEnd" },
        { type: "pipe" },
        { type: "function", value: "filter2" },
        { type: "functionEnd" },
      ],
    }),
    task({
      source: "a|>filter(b)",
      parsed: [
        { type: "key", value: "a" },
        { type: "pipe" },
        { type: "function", value: "filter" },
        { type: "key", value: "b" },
        { type: "functionEnd" },
      ],
    }),
    task({
      source: "a|>filter(b)|>filter2",
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
    }),
    task({
      source: ["a?b:c", " a ? b : c "],
      parsed: [
        { type: "key", value: "a" },
        { type: "ternary", value: true },
        { type: "key", value: "b" },
        { type: "ternary", value: false },
        { type: "key", value: "c" },
      ],
    }),
    task({
      source: 'a?"b":"c"',
      parsed: [
        { type: "key", value: "a" },
        { type: "ternary", value: true },
        { type: "arg", value: "b" },
        { type: "ternary", value: false },
        { type: "arg", value: "c" },
      ],
    }),
    task({
      source: '"a"?"b":"c"',
      parsed: [
        { type: "arg", value: "a" },
        { type: "ternary", value: true },
        { type: "arg", value: "b" },
        { type: "ternary", value: false },
        { type: "arg", value: "c" },
      ],
    }),
    task({
      source: 'a?"?":":"',
      parsed: [
        { type: "key", value: "a" },
        { type: "ternary", value: true },
        { type: "arg", value: "?" },
        { type: "ternary", value: false },
        { type: "arg", value: ":" },
      ],
    }),
    task({
      source: "a ? 0 : -1",
      parsed: [
        { type: "key", value: "a" },
        { type: "ternary", value: true },
        { type: "arg", value: 0 },
        { type: "ternary", value: false },
        { type: "arg", value: -1 },
      ],
    }),
    task({
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
    }),
    task({
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
    }),
    task({
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
    }),
    task({
      source: "1 && b > 1",
      parsed: [
        { type: "arg", value: 1 },
        { type: "operator", value: "&&" },
        { type: "key", value: "b" },
        { type: "operator", value: ">" },
        { type: "arg", value: 1 },
      ],
    }),
    task({
      source: "foo ?? ../foo",
      parsed: [
        { type: "key", value: "foo" },
        { type: "operator", value: "??" },
        { type: "key", value: "../foo" },
      ],
    }),
    task({
      source: "!a || a > 1",
      parsed: [
        { type: "key", value: "a", negated: true },
        { type: "operator", value: "||" },
        { type: "key", value: "a" },
        { type: "operator", value: ">" },
        { type: "arg", value: 1 },
      ],
    }),
    task({
      source: "a |> b(!a || a > 1) ? c : d",
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
    }),
    task({
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
    }),
    task({
      source: "foo(1, a)",
      parsed: [
        { type: "function", value: "foo" },
        { type: "arg", value: 1 },
        { type: "key", value: "a" },
        { type: "functionEnd" },
      ],
    }),
    task({
      source: "foo(a, 1)",
      parsed: [
        { type: "function", value: "foo" },
        { type: "key", value: "a" },
        { type: "arg", value: 1 },
        { type: "functionEnd" },
      ],
    }),
    task({
      source: "a = 1",
      parsed: [
        { type: "key", value: "a" },
        { type: "assignment", value: "=" },
        { type: "arg", value: 1 },
      ],
    }),
    task({
      source: ["a += 1", "a+=1", "a++", "a ++"],
      parsed: [
        { type: "key", value: "a" },
        { type: "assignment", value: "+=" },
        { type: "arg", value: 1 },
      ],
    }),
    task({
      source: ["a -= 1", "a-=1", "a--", "a --"],
      parsed: [
        { type: "key", value: "a" },
        { type: "assignment", value: "-=" },
        { type: "arg", value: 1 },
      ],
    }),
    task({
      source: ["a = one() |> two(^^, b)"],
      parsed: [
        { type: "key", value: "a" },
        { type: "assignment", value: "=" },
        { type: "function", value: "one" },
        { type: "functionEnd" },
        { type: "pipe" },
        { type: "function", value: "two" },
        { type: "placeholder" },
        { type: "key", value: "b" },
        { type: "functionEnd" },
      ],
    }),
  ],

  (test, { source, parsed }) => {
    for (const str of test.utils.arrify(source)) {
      test(str, (t) => {
        const actual = parseExpression(str).map((x) => {
          delete x.pos
          return x
        })
        t.eq(actual, parsed)
      })
    }
  },
)
