import test from "../../../../../42/test.js"
import highlight from "../../../../../42/system/console/formats/highlight.js"

import log from "../../../../../42/system/log.js"

function trace(str, running = 1) {
  // running = 1
  if (running === 0) return
  if (test.env.runtime.inBackend) log.hr()
  log(str)
  if (test.env.runtime.inBackend) log.hr().log()
  else log()
  // console.log(
  //   (str.includes("\n") ? "`\\\n" : "`") + str.replace(/`|\\/g, "\\$&") + "`"
  // )
  // console.log("")
  if (running > 1) throw new Error("fail via trace")
}

test("all tokens", (t) => {
  const str = highlight(`\
// "single" 'line' \`comment\` 1 /a/i
/* "multi"
'line' \`comment\` 2 /b/i */
const abcd = -21 + 8;
let s = "1//";
const b = JSON.stringify({
  "x": \`multi
line string /*1*/ /c/i\`,
  r: /d "-0"\\/**/i, /**/
  n: 0x0000 * 0.5,
  t: true,
  f: false,
});
`)

  trace(str, 0)

  t.is(
    str,
    `\
{dim.bright.magenta // "single" 'line' \`comment\` 1 /a/i}
{dim.bright.magenta /* "multi"
'line' \`comment\` 2 /b/i */}
{bright.green const} abcd {bright.green =} {magenta -21} {bright.green +} {magenta 8}{white.dim ;}
{bright.green let} s {bright.green =} {yellow.dim "}{yellow 1//}{yellow.dim "}{white.dim ;}
{bright.green const} b {bright.green =} {bright.blue JSON}{white.dim .}{bright.red stringify}{white.dim (\\{}
  {yellow.dim "}{yellow x}{yellow.dim "}{white.dim :} {yellow.dim \`}{yellow multi
line string /*1*/ /c/i}{yellow.dim \`}{white.dim ,}
  r{white.dim :} {cyan /d "-0"\\/**/i}{white.dim ,} {dim.bright.magenta /**/}
  n{white.dim :} {magenta }{dim.magenta 0x}{magenta 0000} {bright.green *} {magenta 0}{white.dim .}{magenta 5}{white.dim ,}
  t{white.dim :} {bright.cyan true}{white.dim ,}
  f{white.dim :} {bright.magenta false}{white.dim ,}
{white.dim \\});}
`
  )
})

test("string inside single-line comment", (t) => {
  const str = highlight('// a "string"')
  trace(str, 0)
  t.is(str, `{dim.bright.magenta // a "string"}`)
})

test("multi-line comment inside single-line comment", (t) => {
  const str = highlight("// gulp.watch('./src/**/*.js', ['js']);")
  trace(str, 0)
  t.is(str, `{dim.bright.magenta // gulp.watch('./src/**/*.js', ['js']);}`)
})

test("class methods", (t) => {
  const str = highlight(`\
class Test {
  foo( x, y = 0) {}
  async bar(x, y = 0 ) {}
  $ ( ) {}
  awaitFoo(){}
  Example({ props: { a: _A, b} } = Props) {}
  f(x = fun(), y = 0) {}
}`)
  trace(str, 0)
  t.is(
    str,
    `\
{bright.green class} Test {white.dim \\{}
  {bright.red foo}{white.dim (} x{white.dim ,} y {bright.green =} {magenta 0}{white.dim )} {white.dim \\{\\}}
  {bright.green async} {bright.red bar}{white.dim (}x{white.dim ,} y {bright.green =} {magenta 0} {white.dim )} {white.dim \\{\\}}
  {bright.red $} {white.dim (} {white.dim )} {white.dim \\{\\}}
  {bright.red awaitFoo}{white.dim ()\\{\\}}
  {bright.red Example}{white.dim (\\{} props{white.dim :} {white.dim \\{} a{white.dim :} _A{white.dim ,} b{white.dim \\}} {white.dim \\}} {bright.green =} Props{white.dim )} {white.dim \\{\\}}
  {bright.red f}{white.dim (}x {bright.green =} {bright.red fun}{white.dim (),} y {bright.green =} {magenta 0}{white.dim )} {white.dim \\{\\}}
{white.dim \\}}`
  )
})

test("numbers", (t) => {
  // @src https://github.com/PrismJS/prism/blob/master/tests/languages/javascript/number_feature.test
  const str = highlight(`\
42
3.14159
4e10
3.2E+6
2.1e-10
0b1101
0o571
0xbabe
0xBABE
NaN
Infinity
123n
0x123n
1_000_000_000_000
1_000_000.220_720
0b0101_0110_0011_1000
0o12_34_56
0x40_76_38_6A_73
4_642_473_943_484_686_707n
0.000_001
1e10_000`)
  trace(str, 0)
  t.is(
    str,
    `\
{magenta 42}
{magenta 3}{white.dim .}{magenta 14159}
{magenta 4e10}
{magenta 3}{white.dim .}{magenta 2}{dim.magenta E+}{magenta 6}
{magenta 2}{white.dim .}{magenta 1}{dim.magenta e-}{magenta 10}
{magenta }{dim.magenta 0b}{magenta 1101}
{magenta }{dim.magenta 0o}{magenta 571}
{magenta }{dim.magenta 0x}{magenta babe}
{magenta }{dim.magenta 0x}{magenta BABE}
{magenta NaN}
{magenta Infinity}
{magenta 123}{dim.magenta n}{magenta }
{magenta }{dim.magenta 0x}{magenta 123}{dim.magenta n}{magenta }
{magenta 1}{dim.magenta _}{magenta 000}{dim.magenta _}{magenta 000}{dim.magenta _}{magenta 000}{dim.magenta _}{magenta 000}
{magenta 1}{dim.magenta _}{magenta 000}{dim.magenta _}{magenta 000}{white.dim .}{magenta 220}{dim.magenta _}{magenta 720}
{magenta }{dim.magenta 0b}{magenta 0101}{dim.magenta _}{magenta 0110}{dim.magenta _}{magenta 0011}{dim.magenta _}{magenta 1000}
{magenta }{dim.magenta 0o}{magenta 12}{dim.magenta _}{magenta 34}{dim.magenta _}{magenta 56}
{magenta }{dim.magenta 0x}{magenta 40}{dim.magenta _}{magenta 76}{dim.magenta _}{magenta 38}{dim.magenta _}{magenta 6A}{dim.magenta _}{magenta 73}
{magenta 4}{dim.magenta _}{magenta 642}{dim.magenta _}{magenta 473}{dim.magenta _}{magenta 943}{dim.magenta _}{magenta 484}{dim.magenta _}{magenta 686}{dim.magenta _}{magenta 707}{dim.magenta n}{magenta }
{magenta 0}{white.dim .}{magenta 000}{dim.magenta _}{magenta 001}
{magenta 1e10}{dim.magenta _}{magenta 000}`
  )
})

test("stringify.inspect", 1, (t) => {
  const str = highlight(
    '`{\n  key: [ 1, 2, 3 ],\n  "two \\"word\\"": [ { a: 1, key: "ok ok" } ],\n  obj: /* [↖] */ { $ref: "#" },\n}`'
  )
  trace(str, 0)
  t.is(
    str,
    `\
{yellow.dim \`}{yellow \\{
  key: [ 1, 2, 3 ],
  "two \\"word\\"": [ \\{ a: 1, key: "ok ok" \\} ],
  obj: /* [↖] */ \\{ $ref: "#" \\},
\\}}{yellow.dim \`}`
  )
})

test("stringify.inspect", 2, (t) => {
  const str = highlight(
    `\
{
  object: {},
  circular: /* [↖] */ { $ref: "#" },
  map: new Map([
    [ "prop", "value" ],
  ]),
  array: [
    -0,
    Infinity,
    NaN,
  ],
  [Symbol("foo")]: "foo",
}`
  )
  trace(str, 0)
  t.is(
    str,
    `\
{white.dim \\{}
  object{white.dim :} {white.dim \\{\\},}
  circular{white.dim :} {dim.bright.magenta /* [↖] */} {white.dim \\{} $ref{white.dim :} {yellow.dim "}{yellow #}{yellow.dim "} {white.dim \\},}
  map{white.dim :} {bright.green new} {bright.blue Map}{white.dim ([}
    {white.dim [} {yellow.dim "}{yellow prop}{yellow.dim "}{white.dim ,} {yellow.dim "}{yellow value}{yellow.dim "} {white.dim ],}
  {white.dim ]),}
  array{white.dim :} {white.dim [}
    {magenta -0}{white.dim ,}
    {magenta Infinity}{white.dim ,}
    {magenta NaN}{white.dim ,}
  {white.dim ],}
  {white.dim [}{bright.blue Symbol}{white.dim (}{yellow.dim "}{yellow foo}{yellow.dim "}{white.dim )]:} {yellow.dim "}{yellow foo}{yellow.dim "}{white.dim ,}
{white.dim \\}}`
  )
})

test("primitives", (t) => {
  const str = highlight(
    `\
[{}, [1], NaN, Infinity, false, true, null, undefined, 1, this]`
  )
  trace(str, 0)
  t.is(
    str,
    "{white.dim [\\{\\},} {white.dim [}{magenta 1}{white.dim ],} {magenta NaN}{white.dim ,} {magenta Infinity}{white.dim ,} {bright.magenta false}{white.dim ,} {bright.cyan true}{white.dim ,} {magenta null}{white.dim ,} {magenta undefined}{white.dim ,} {magenta 1}{white.dim ,} {magenta this}{white.dim ]}"
  )
})

test("function", (t) => {
  const str = highlight(
    `\
function derp(ctx) {
  if (ctx) {
    const s = Symbol(ctx)
    console.log(s)
  }
}`
  )
  trace(str, 0)
  t.is(
    str,
    `\
{bright.green function} {bright.red derp}{white.dim (}ctx{white.dim )} {white.dim \\{}
  {bright.green if} {white.dim (}ctx{white.dim )} {white.dim \\{}
    {bright.green const} s {bright.green =} {bright.blue Symbol}{white.dim (}ctx{white.dim )}
    {bright.cyan console}{white.dim .}{bright.red log}{white.dim (}s{white.dim )}
  {white.dim \\}}
{white.dim \\}}`
  )
})

test("ignore keyword as properties", (t) => {
  const str = highlight(
    `{console:1,true:1,catch:1,await:1,Array:1,delete:1,b:1}`
  )
  trace(str, 0)
  t.is(
    str,
    "{white.dim \\{}console{white.dim :}{magenta 1}{white.dim ,}true{white.dim :}{magenta 1}{white.dim ,}catch{white.dim :}{magenta 1}{white.dim ,}await{white.dim :}{magenta 1}{white.dim ,}Array{white.dim :}{magenta 1}{white.dim ,}delete{white.dim :}{magenta 1}{white.dim ,}b{white.dim :}{magenta 1}{white.dim \\}}"
  )
})

test.skip("colorise log-escaped strings", (t) => {
  const str = highlight(`console.log(\\{\\})`)
  trace(str, 0)
  t.is(str)
})

test("bug: comment before function", (t) => {
  const str = highlight(`/* returnTrue */ () => true`)
  trace(str, 0)
  t.is(
    str,
    "{dim.bright.magenta /* returnTrue */} {white.dim ()} {bright.green =}{bright.green >} {bright.cyan true}"
  )
})

test("bug: regex solo", (t) => {
  const str = highlight(`/^([\\dA-Za-z]){21}$/`)
  trace(str, 0)
  t.is(str, "{cyan /^([\\dA-Za-z])\\{21\\}$/}")
})

test.todo("{delete(){}}", (t) => {
  const str = highlight(`{delete(){}}`)
  trace(str, 0)
  t.is(str, "")
})
