import test from "../../../../../42/test.js"
import hash from "../../../../../42/fabric/type/any/hash.js"

test.tasks(
  [
    { actual: "" }, //
    { actual: "hello" },
  ],
  (test, { actual, expected }) => {
    test.only(actual, (t) => {
      t.is(hash(actual), expected)
      t.is(hash(actual), expected, "Didn't repeat")
    })
  }
)
