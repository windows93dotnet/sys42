import test from "../../../../42/test.js"
import parseURLQuery from "../../../../42/fabric/url/parseURLQuery.js"
import JSON5 from "../../../../42/core/formats/json5.js"

test((t) => {
  t.eq(parseURLQuery("https://example.com/?foo"), { foo: true })
  t.eq(parseURLQuery("foo"), {})
  t.eq(parseURLQuery("?foo"), { foo: true })
  t.eq(parseURLQuery("?foo="), { foo: true })
  t.eq(parseURLQuery("?foo&bar"), { foo: true, bar: true })
  t.eq(parseURLQuery("?foo=true"), { foo: true })
  t.eq(parseURLQuery("?foo=false"), { foo: false })
  t.eq(parseURLQuery("?foo=undefined"), { foo: undefined })
  t.eq(parseURLQuery("?foo=null"), { foo: null })
  t.eq(parseURLQuery('?foo="bar"'), { foo: "bar" })
  t.eq(parseURLQuery("?foo=42"), { foo: 42 })
  t.eq(parseURLQuery("?foo=[42]"), { foo: [42] })
  t.eq(parseURLQuery('?foo={"a":1}'), { foo: { a: 1 } })
  t.eq(parseURLQuery("?foo={a:1}"), { foo: "{a:1}" })
  t.eq(parseURLQuery("?foo={a:1}", { parseValue: JSON5.parse }), {
    foo: { a: 1 },
  })
  t.eq(parseURLQuery('?foo.bar="baz"'), { foo: { bar: "baz" } })
  t.eq(parseURLQuery('?foo.bar={"a":1}'), { foo: { bar: { a: 1 } } })
})
