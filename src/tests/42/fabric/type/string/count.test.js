import test from "../../../../../42/test.js"
import count from "../../../../../42/fabric/type/string/count.js"

test("count", (t) => {
  const str = "i ♥ 🍕"
  t.is(str.length, 6)
  t.is(new Blob([str]).size, 10)
  t.is(count.letters(str), 5)
  t.is(count.words(str), 3)
  t.is(count.bytes(str), 10)
})
