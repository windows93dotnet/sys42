import test from "../../../../42/test.js"
import parseLogTemplate from "../../../../42/core/console/parseLogTemplate.js"

const { task } = test

test.tasks(
  [
    task({
      input: "{bold Hello, {cyan World!} This is a} test. {green Woo!}",
      expected: [
        { type: "style", content: "bold", nested: 1 },
        { type: "text", content: "Hello, ", nested: 1 },
        { type: "style", content: "cyan", nested: 2 },
        { type: "text", content: "World!", nested: 2 },
        { type: "text", content: " This is a", nested: 1 },
        { type: "text", content: " test. ", nested: 0 },
        { type: "style", content: "green", nested: 1 },
        { type: "text", content: "Woo!", nested: 1 },
      ],
    }),

    task({
      input: "a {b}",
      expected: [
        { type: "text", content: "a {b}", nested: 0 }, //
      ],
    }),

    task({
      input: "{a}",
      expected: [
        { type: "text", content: "{a}", nested: 0 }, //
      ],
    }),

    task({
      input: "{ a }",
      expected: [
        { type: "text", content: "{ a }", nested: 0 }, //
      ],
    }),

    task({
      input: "{abc }",
      expected: [
        { type: "style", content: "abc", nested: 1 }, //
      ],
    }),

    task({
      input: "{abc  }",
      expected: [
        { type: "style", content: "abc", nested: 1 }, //
        { type: "text", content: " ", nested: 1 }, //
      ],
    }),

    task({
      input: "{ a:abc }",
      expected: [
        { type: "text", content: "{ a:abc }", nested: 0 }, //
      ],
    }),

    task({
      input: "a \\{f00 c\\}",
      expected: [
        { type: "text", content: "a {f00 c}", nested: 0 }, //
      ],
    }),

    task({
      input: "a \\\\{f00 c\\\\}",
      expected: [
        { type: "text", content: "a \\{f00 c\\}", nested: 0 }, //
      ],
    }),

    task({
      input: "function() {console.log(' ')}",
      expected: [
        { type: "text", content: "function() {console.log(' ')}", nested: 0 },
      ],
    }),
  ],

  (test, { input, expected }) => {
    test(input, (t) => {
      t.eq(parseLogTemplate(input), expected)
    })
  },
)
