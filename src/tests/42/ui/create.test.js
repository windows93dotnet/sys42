import test from "../../../42/test.js"
import create from "../../../42/ui/create.js"
import Stage from "../../../42/ui/classes/Stage.js"
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
    create("strong", "world"),
  )
  t.true(el instanceof HTMLDivElement)
  t.is(
    el.outerHTML,
    '<div id="uniq" class="foo">hello<strong>world</strong></div>',
  )
})

test("abbr", "id", 2, (t) => {
  const el = create(
    "div#uniq",
    { class: "foo", id: "overwrite" },
    "hello",
    create("strong", "world"),
  )
  t.true(el instanceof HTMLDivElement)
  t.is(
    el.outerHTML,
    '<div id="overwrite" class="foo">hello<strong>world</strong></div>',
  )
})

test("abbr", "class", (t) => {
  const el = create(
    "div#uniq.bar",
    { class: "foo" },
    "hello",
    create("strong", "world"),
  )
  t.true(el instanceof HTMLDivElement)
  t.is(
    el.outerHTML,
    '<div id="uniq" class="foo bar">hello<strong>world</strong></div>',
  )
})

test("abbr", "class + style", (t) => {
  const el = create("div#uniq.bar", { style: "color:red" }, "hello")
  t.true(el instanceof HTMLDivElement)
  t.is(
    el.outerHTML,
    '<div id="uniq" class="bar" style="color: red;">hello</div>',
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
    "what's up?",
  )
  t.is(
    el.outerHTML,
    `<div class="foo">hello<strong>world</strong>what's up?</div>`,
  )
})

test("arguments are deeply merged", (t) => {
  const el = create("div", { class: "foo", title: "hello" }, { class: "bar" })
  t.is(el.outerHTML, '<div class="bar" title="hello"></div>')
})

test("dynamic id", (t) => {
  const el = create("div", { id: true })
  t.match(el.id, /^[a-z][\dA-Za-z]{7}$/)
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

test("stage", async (t) => {
  const stage = new Stage()
  stage.reactive.set("foo", "bar")
  const child = create(stage, "span", { class: "{{foo}}" })
  const el = create(stage, "div", { class: "derp" }, child)
  el.append(child)
  await t.utils.untilNextRepaint()

  t.is(el.outerHTML, '<div class="derp"><span class="bar"></span></div>')

  stage.reactive.set("foo", "baz")
  await t.utils.untilNextRepaint()

  t.is(el.outerHTML, '<div class="derp"><span class="baz"></span></div>')
})

test("stage", "renderKeyVal 'dynamic' bug", async (t) => {
  const stage = new Stage()
  const child = create(stage, "span", { class: "bar" })
  const el = create(stage, "div", { class: "derp" }, child)

  t.is(el.outerHTML, '<div class="derp"><span class="bar"></span></div>')
})
