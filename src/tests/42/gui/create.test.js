import test from "../../../42/test.js"
import create from "../../../42/gui/create.js"
import normalize from "../../../42/gui/normalize.js"
import repaint from "../../../42/fabric/type/promise/repaint.js"
import setAttributes from "../../../42/fabric/dom/setAttributes.js"

test("simple", (t) => {
  const el = create("div", { class: "foo" }, "hello", create("strong", "world"))
  t.true(el instanceof HTMLDivElement)
  t.is(el.outerHTML, '<div class="foo">hello<strong>world</strong></div>')
})

test("abbr", "id", (t) => {
  const el = create(
    "div#uniq",
    { class: "foo" },
    "hello",
    create("strong", "world")
  )
  t.true(el instanceof HTMLDivElement)
  t.is(
    el.outerHTML,
    '<div id="uniq" class="foo">hello<strong>world</strong></div>'
  )
})

test("abbr", "id", 2, (t) => {
  const el = create(
    "div#uniq",
    { class: "foo", id: "overwrite" },
    "hello",
    create("strong", "world")
  )
  t.true(el instanceof HTMLDivElement)
  t.is(
    el.outerHTML,
    '<div id="overwrite" class="foo">hello<strong>world</strong></div>'
  )
})

test("abbr", "class", (t) => {
  const el = create(
    "div#uniq.bar",
    { class: "foo" },
    "hello",
    create("strong", "world")
  )
  t.true(el instanceof HTMLDivElement)
  t.is(
    el.outerHTML,
    '<div id="uniq" class="foo bar">hello<strong>world</strong></div>'
  )
})

test("arguments order matter only for child nodes", (t) => {
  const el = create("div", "hello", create("strong", "world"), {
    class: "foo",
  })
  t.is(el.outerHTML, '<div class="foo">hello<strong>world</strong></div>')
})

test("accept arrays of child nodes", (t) => {
  let el = create("div", { class: "foo" }, ["hello", create("strong", "world")])
  t.is(el.outerHTML, '<div class="foo">hello<strong>world</strong></div>')

  el = create(
    "div",
    { class: "foo" },
    ["hello", create("strong", "world")],
    "what's up?"
  )
  t.is(
    el.outerHTML,
    `<div class="foo">hello<strong>world</strong>what's up?</div>`
  )
})

test("arguments are deeply merged", (t) => {
  const el = create("div", { class: "foo", title: "hello" }, { class: "bar" })
  t.is(el.outerHTML, '<div class="bar" title="hello"></div>')
})

test("dynamic id", (t) => {
  const el = create("div", { id: true })
  t.match(el.id, /^[a-z][\da-z]{7}$/)
})

test("classes", (t) => {
  let el
  el = create("div", { class: "one" })
  t.is(el.className, "one")
  el = create("div", { class: "one two" })
  t.is(el.className, "one two")
  el = create("div", { class: { one: true, two: true } })
  t.is(el.className, "one two")
})

test("classes", 2, (t) => {
  let el = create("div")
  el.className = "one two three four"
  el = setAttributes(el, { class: { two: false } })
  t.is(el.className, "one three four")
  el = setAttributes(el, { class: { "one four": false } })
  t.is(el.className, "three")
  el = setAttributes(el, { class: { "x y z": true } })
  t.is(el.className, "three x y z")
})

test("ctx", async (t) => {
  const { ctx } = normalize()
  ctx.state.set("foo", "bar")
  const child = create(ctx, "span", { class: "{{foo}}" })
  const el = create(ctx, "div", { class: "derp" }, child)
  el.append(child)
  await repaint()

  t.is(el.outerHTML, '<div class="derp"><span class="bar"></span></div>')

  ctx.state.set("foo", "baz")
  await repaint()

  t.is(el.outerHTML, '<div class="derp"><span class="baz"></span></div>')
})

test("ctx", "renderKeyVal 'dynamic' bug", async (t) => {
  const { ctx } = normalize()
  const child = create(ctx, "span", { class: "bar" })
  const el = create(ctx, "div", { class: "derp" }, child)

  t.is(el.outerHTML, '<div class="derp"><span class="bar"></span></div>')
})
