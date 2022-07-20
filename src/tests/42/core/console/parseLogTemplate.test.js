import test from "../../../../42/test.js"
import parseLogTemplate from "../../../../42/core/console/parseLogTemplate.js"

const { task } = test

test.tasks(
  [
    task({
      input: "{bold Hello, {cyan World!} This is a} test. {green Woo!}",
      expected: [
        { type: "style", buffer: "bold", nested: 1 },
        { type: "text", buffer: "Hello, ", nested: 1 },
        { type: "style", buffer: "cyan", nested: 2 },
        { type: "text", buffer: "World!", nested: 2 },
        { type: "text", buffer: " This is a", nested: 1 },
        { type: "text", buffer: " test. ", nested: 0 },
        { type: "style", buffer: "green", nested: 1 },
        { type: "text", buffer: "Woo!", nested: 1 },
      ],
    }),

    task({
      input: "a {b}",
      expected: [
        { type: "text", buffer: "a {b}", nested: 0 }, //
      ],
    }),

    task({
      input: "{a}",
      expected: [
        { type: "text", buffer: "{a}", nested: 0 }, //
      ],
    }),

    task({
      input: "{ a }",
      expected: [
        { type: "text", buffer: "{ a }", nested: 0 }, //
      ],
    }),

    task({
      input: "{abc }",
      expected: [
        { type: "style", buffer: "abc", nested: 1 }, //
      ],
    }),

    task({
      input: "{abc  }",
      expected: [
        { type: "style", buffer: "abc", nested: 1 }, //
        { type: "text", buffer: " ", nested: 1 }, //
      ],
    }),

    task({
      input: "{ a:abc }",
      expected: [
        { type: "text", buffer: "{ a:abc }", nested: 0 }, //
      ],
    }),

    task({
      input: "a \\{f00 c\\}",
      expected: [
        { type: "text", buffer: "a {f00 c}", nested: 0 }, //
      ],
    }),

    task({
      input: "a \\\\{f00 c\\\\}",
      expected: [
        { type: "text", buffer: "a \\{f00 c\\}", nested: 0 }, //
      ],
    }),

    task({
      input: "function() {console.log(' ')}",
      expected: [
        { type: "text", buffer: "function() {console.log(' ')}", nested: 0 },
      ],
    }),
  ],

  (test, { input, expected }) => {
    test(input, (t) => {
      t.eq(parseLogTemplate(input), expected)
    })
  }
)
