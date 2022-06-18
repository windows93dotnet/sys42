import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

const elements = []
function tmp(connect = true) {
  const el = document.createElement("div")
  elements.push(el)
  if (connect) document.body.append(el)
  return el
}

test.teardown(() => {
  for (const el of elements) el.remove()
  elements.length = 0
})

test.suite.timeout(1000)

test("html", async (t) => {
  const app = await ui(tmp(), {
    tag: "ui-icon",
    path: "/script.js",
  })

  t.eq(app.state.value, {
    "ui-icon": { 0: { path: "/script.js", small: undefined, label: true } },
  })

  t.eq(Object.keys(app.ctx.renderers), [
    "/ui-icon/0/path",
    "/ui-icon/0/infos/description",
    "/ui-icon/0/infos/image",
    "/ui-icon/0/label",
    "/ui-icon/0/infos/stem",
    "/ui-icon/0/infos/isFile",
    "/ui-icon/0/infos/ext",
  ])

  t.is(
    test.utils.prettify(app.el.innerHTML),
    `\
<ui-icon path="/script.js" label="" tabindex="0" aria-description="file" role="button">
  <div aria-hidden="true" class="ui-icon__figure">
    <img class="ui-icon__image" src="/42/themes/default/icons/subtype/javascript.png">
    <div class="ui-icon__mask" style="-webkit-mask-image: url(&quot;/42/themes/default/icons/subtype/javascript.png&quot;);">
    </div>
  </div>
  <!--[when]-->
  <div class="ui-icon__label">
    <svg>
      <rect>
      </rect>
    </svg>
    <span>script</span>
    <!--[when]-->
    <span>\u200b.js</span>
  </div>
</ui-icon>`
  )

  t.is(app.el.textContent, "script\u200b.js")

  app.get("ui-icon").path = "/derp/foo.bar/"
  await app

  t.is(app.el.textContent, "foo\u200b.bar")
})

test("infos", async (t) => {
  const app = await ui(tmp(), [
    {
      tag: "ui-icon",
      path: "/derp/foo.js",
    },
    {
      tag: "ui-icon",
      path: "/derp/foo/",
    },
    {
      tag: "ui-icon",
      path: "/derp/foo.bar/",
    },
    {
      tag: "ui-icon",
      path: "https://www.windows93.net/",
    },
    {
      tag: "ui-icon",
      path: "https://www.windows93.net/script.js",
    },
  ])

  t.eq(app.state.value, {
    "ui-icon": {
      0: { path: "/derp/foo.js", small: undefined, label: true },
      1: { path: "/derp/foo/", small: undefined, label: true },
      2: { path: "/derp/foo.bar/", small: undefined, label: true },
      3: { path: "https://www.windows93.net/", small: undefined, label: true },
      4: {
        path: "https://www.windows93.net/script.js",
        small: undefined,
        label: true,
      },
    },
  })

  const icons = app.batch("ui-icon")
  const { infos } = icons

  t.eq(
    infos.map(({ name, ext, stem }) => ({ name, ext, stem })),
    [
      { name: "foo", ext: ".js", stem: "foo" },
      { name: "foo", ext: "", stem: "foo" },
      { name: "foo.bar", ext: "", stem: "foo\u200b.bar" },
      { name: "", ext: "", stem: "windows93\u200b.net" },
      {
        name: "script",
        ext: ".js",
        stem: "windows93\u200b.net/script\u200b.js",
      },
    ]
  )

  t.eq(
    infos.map(({ isURI, isDir, isFile }) => ({
      isURI,
      isDir,
      isFile,
    })),
    [
      { isURI: false, isDir: false, isFile: true },
      { isURI: false, isDir: true, isFile: false },
      { isURI: false, isDir: true, isFile: false },
      { isURI: true, isDir: false, isFile: false },
      { isURI: true, isDir: false, isFile: false },
    ]
  )

  t.eq(
    infos.map(({ mimetype }) => mimetype),
    [
      "text/javascript",
      "inode/directory",
      "inode/directory",
      "text/x-uri",
      "text/x-uri",
    ]
  )

  t.eq(
    infos.map(({ image }) => image),
    [
      "/42/themes/default/icons/subtype/javascript.png",
      "/42/themes/default/icons/places/folder.png",
      "/42/themes/default/icons/places/folder.png",
      "/42/themes/default/icons/ext/url.png",
      "/42/themes/default/icons/ext/url.png",
    ]
  )

  t.eq(icons.textContent, [
    "foo\u200b.js",
    "foo",
    "foo\u200b.bar",
    "windows93\u200b.net",
    "windows93\u200b.net/script\u200b.js",
  ])

  t.eq(icons.ariaDescription, [
    "file", //
    "folder",
    "folder",
    "uri",
    "uri",
  ])
})

test("repeat", async (t) => {
  const app = await ui(tmp(), {
    content: {
      scope: "arr",
      repeat: {
        tag: "ui-icon",
        path: "{{x}}",
      },
    },
    data: {
      arr: [
        { x: "/derp/foo.js" }, //
        { x: "/derp/" },
      ],
    },
  })

  t.eq(app.state.value, {
    "arr": [{ x: "/derp/foo.js" }, { x: "/derp/" }],
    "ui-icon": {
      0: { small: undefined, label: true, path: { $ref: "/arr/0/x" } },
      1: { small: undefined, label: true, path: { $ref: "/arr/1/x" } },
    },
  })

  t.eq(Object.keys(app.ctx.renderers).slice(0, 6), [
    "/arr",
    "/arr/0/x",
    "/ui-icon/0/path",
    "/arr/1/x",
    "/ui-icon/1/path",
    "/ui-icon/0/infos/description",
  ])

  const icons = app.batch("ui-icon", { live: true })
  t.eq(icons.textContent, ["foo\u200b.js", "derp"])

  app.data.arr = [{ x: "bar.txt" }]
  await app

  t.eq(icons.textContent, ["bar\u200b.txt"])
})

test("repeat", 2, async (t) => {
  const app = await ui(tmp(), {
    content: {
      scope: "arr",
      repeat: {
        tag: "ui-icon",
        path: "{{.}}",
      },
    },
    data: {
      arr: [
        "/derp/foo.js", //
        "/derp/",
      ],
    },
  })

  t.eq(app.state.value, {
    "arr": ["/derp/foo.js", "/derp/"],
    "ui-icon": {
      0: { small: undefined, label: true, path: { $ref: "/arr/0" } },
      1: { small: undefined, label: true, path: { $ref: "/arr/1" } },
    },
  })

  t.eq(Object.keys(app.ctx.renderers).slice(0, 6), [
    "/arr",
    "/arr/0",
    "/ui-icon/0/path",
    "/arr/1",
    "/ui-icon/1/path",
    "/ui-icon/0/infos/description",
  ])

  const icons = app.batch("ui-icon", { live: true })
  t.eq(icons.textContent, ["foo\u200b.js", "derp"])

  app.data.arr = ["bar.txt"]
  await app

  t.eq(icons.textContent, ["bar\u200b.txt"])
})
