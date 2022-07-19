import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

test.suite.timeout(5000)

const tmp = test.utils.container({ id: "ui-icon-tests", connect: true })

test("html", async (t) => {
  const app = await ui(tmp(), {
    tag: "ui-icon",
    path: "/script.js",
  })

  t.eq(app.reactive.data, {
    "ui-icon": { root: { path: "/script.js", small: undefined, label: true } },
  })

  t.eq(Object.keys(app.ctx.renderers), [
    "/ui-icon/root/path",
    "/ui-icon/root/infos/description",
    "/ui-icon/root/infos/image",
    "/ui-icon/root/label",
    "/ui-icon/root/infos/stem",
    "/ui-icon/root/infos/isFile",
    "/ui-icon/root/infos/ext",
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
  <!--[if]-->
  <div class="ui-icon__label">
    <svg>
      <rect>
      </rect>
    </svg>
    <span>script</span>
    <!--[if]-->
    <span>\u200b.js</span>
  </div>
</ui-icon>`
  )

  t.is(app.el.textContent, "script\u200b.js")

  app.query("ui-icon").path = "/derp/foo.bar/"
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

  t.eq(app.reactive.data, {
    "ui-icon": {
      "root,0": { path: "/derp/foo.js", small: undefined, label: true },
      "root,1": { path: "/derp/foo/", small: undefined, label: true },
      "root,2": { path: "/derp/foo.bar/", small: undefined, label: true },
      "root,3": {
        path: "https://www.windows93.net/",
        small: undefined,
        label: true,
      },
      "root,4": {
        path: "https://www.windows93.net/script.js",
        small: undefined,
        label: true,
      },
    },
  })

  const icons = app.each("ui-icon")
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

test("each", async (t) => {
  const app = await ui(tmp(), {
    content: {
      scope: "arr",
      each: {
        tag: "ui-icon",
        path: "{{x}}",
      },
    },
    state: {
      arr: [
        { x: "/derp/foo.js" }, //
        { x: "/derp/" },
      ],
    },
  })

  t.eq(app.reactive.data, {
    "arr": [{ x: "/derp/foo.js" }, { x: "/derp/" }],
    "ui-icon": {
      "root,[0]": {
        small: undefined,
        label: true,
        path: { $ref: "/arr/0/x" },
      },
      "root,[1]": {
        small: undefined,
        label: true,
        path: { $ref: "/arr/1/x" },
      },
    },
  })

  t.eq(Object.keys(app.ctx.renderers).slice(0, 7), [
    "/arr",
    "/arr/0/x",
    "/ui-icon/root,[0]/path",
    "/arr/1/x",
    "/ui-icon/root,[1]/path",
    "/ui-icon/root,[0]/infos/description",
    "/ui-icon/root,[1]/infos/description",
  ])

  const icons = app.each("ui-icon", { live: true })
  t.eq(icons.textContent, ["foo\u200b.js", "derp"])

  app.state.arr = [{ x: "bar.txt" }]
  await app

  t.eq(icons.textContent, ["bar\u200b.txt"])
})

test("each", 2, async (t) => {
  const app = await ui(tmp(), {
    content: {
      scope: "arr",
      each: {
        tag: "ui-icon",
        path: "{{.}}",
      },
    },
    state: {
      arr: [
        "/derp/foo.js", //
        "/derp/",
      ],
    },
  })

  t.eq(app.reactive.data, {
    "arr": ["/derp/foo.js", "/derp/"],
    "ui-icon": {
      "root,[0]": { small: undefined, label: true, path: { $ref: "/arr/0" } },
      "root,[1]": { small: undefined, label: true, path: { $ref: "/arr/1" } },
    },
  })

  t.eq(Object.keys(app.ctx.renderers).slice(0, 6), [
    "/arr",
    "/arr/0",
    "/ui-icon/root,[0]/path",
    "/arr/1",
    "/ui-icon/root,[1]/path",
    "/ui-icon/root,[0]/infos/description",
  ])

  const icons = app.each("ui-icon", { live: true })
  t.eq(icons.textContent, ["foo\u200b.js", "derp"])

  app.state.arr = ["bar.txt"]
  await app

  t.eq(icons.textContent, ["bar\u200b.txt"])
})
