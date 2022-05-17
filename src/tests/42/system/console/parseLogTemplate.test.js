import test from "../../../../42/test.js"
import parseLogTemplate from "../../../../42/system/console/parseLogTemplate.js"

test.tasks(
  [
    {
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
    },

    {
      input: "a {b}",
      expected: [
        { type: "text", buffer: "a {b}", nested: 0 }, //
      ],
    },

    {
      input: "a \\{f00 c\\}",
      expected: [
        { type: "text", buffer: "a {f00 c}", nested: 0 }, //
      ],
    },

    {
      input: "a \\\\{f00 c\\\\}",
      expected: [
        { type: "text", buffer: "a \\{f00 c\\}", nested: 0 }, //
      ],
    },

    {
      input: "function() {console.log(' ')}",
      expected: [
        { type: "text", buffer: "function() {console.log(' ')}", nested: 0 },
      ],
    },
  ],

  ({ input, expected }) => {
    test(input, (t) => {
      t.eq(parseLogTemplate(input), expected)
    })
  }
)
