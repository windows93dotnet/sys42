import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"
import cssPrefix from "../../../../42/fabric/cssom/cssPrefix.js"
import toKebabCase from "../../../../42/fabric/type/string/case/toKebabCase.js"

test.suite.timeout(2000)

test("html", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest({ connect: true }), {
      tag: "ui-icon",
      path: "/script.js",
    }),
  )

  t.eq(t.utils.omit(app.reactive.data, ["$computed"]), {
    $ui: {
      icon: { root: { path: "/script.js", small: false, label: true } },
    },
  })

  t.eq(Object.keys(app.stage.renderers), [
    "/$ui/icon/root/path",
    "/$ui/icon/root/small",
    "/$ui/icon/root/label",
    "/$ui/icon/root/infos/description",
    "/$ui/icon/root/infos/image",
    "/$ui/icon/root/infos/name",
    "/$ui/icon/root/infos/ext",
  ])

  const maskImage = "mask-image"
  const prefix = cssPrefix(maskImage)
  const cssKey = prefix ? "-" + toKebabCase(prefix) : maskImage

  t.is(
    test.utils.prettify(app.el.innerHTML),
    `\
<ui-icon path="/script.js" aria-description="file">
  <!--[rendered]-->
  <div class="ui-icon__figure" aria-hidden="true">
    <img class="ui-icon__image" fetchpriority="high" decoding="async" src="/42/themes/default/icons/32x32/subtype/javascript.png">
    <div class="ui-icon__mask" style="${cssKey}: url(&quot;/42/themes/default/icons/32x32/subtype/javascript.png&quot;);">
    </div>
  </div>
  <!--[if]-->
  <div class="ui-icon__label">
    <span class="ui-icon__name">script</span>
    <span class="ui-icon__ext">\u200b.js</span>
  </div>
</ui-icon>`,
  )

  const el = app.el.querySelector("ui-icon")

  t.is(el.textContent, "script\u200b.js")
  t.is(el.getAttribute("aria-description"), "file")
  t.is(
    el.querySelector(":scope img").getAttribute("src"),
    "/42/themes/default/icons/32x32/subtype/javascript.png",
  )

  el.path = "/derp/foo.bar/"
  await app

  t.is(el.textContent, "foo\u200b.bar\u200b")
  t.is(el.getAttribute("aria-description"), "folder")
  t.is(
    el.querySelector(":scope img").getAttribute("src"),
    "/42/themes/default/icons/32x32/places/folder.png",
  )

  el.path = "https://www.windows93.net/"
  await app

  t.is(el.textContent, "windows93\u200b.net\u200b")
  t.is(el.getAttribute("aria-description"), "uri")
  t.is(
    el.querySelector(":scope img").getAttribute("src"),
    "/42/themes/default/icons/32x32/ext/url.png",
  )
})

test("infos", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest({ connect: true }), [
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
    ]),
  )

  t.eq(t.utils.omit(app.reactive.data, ["$computed"]), {
    $ui: {
      icon: {
        "root,0": { path: "/derp/foo.js", small: false, label: true },
        "root,1": { path: "/derp/foo/", small: false, label: true },
        "root,2": { path: "/derp/foo.bar/", small: false, label: true },
        "root,3": {
          path: "https://www.windows93.net/",
          small: false,
          label: true,
        },
        "root,4": {
          path: "https://www.windows93.net/script.js",
          small: false,
          label: true,
        },
      },
    },
  })

  const icons = t.puppet.$$$("ui-icon", app.el)
  const { infos } = icons

  t.eq(
    infos.map(({ ext, name }) => ({ ext, name })),
    [
      { ext: ".js", name: "foo" },
      { ext: "", name: "foo" },
      { ext: "", name: "foo\u200b.bar" },
      { ext: "", name: "windows93\u200b.net" },
      { ext: "", name: "windows93\u200b.net/script\u200b.js" },
    ],
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
    ],
  )

  t.eq(
    infos.map(({ mimetype }) => mimetype),
    [
      "text/javascript",
      "inode/directory",
      "inode/directory",
      "text/x-uri",
      "text/x-uri",
    ],
  )

  t.eq(
    infos.map(({ image }) => image),
    [
      "/42/themes/default/icons/32x32/subtype/javascript.png",
      "/42/themes/default/icons/32x32/places/folder.png",
      "/42/themes/default/icons/32x32/places/folder.png",
      "/42/themes/default/icons/32x32/ext/url.png",
      "/42/themes/default/icons/32x32/ext/url.png",
    ],
  )

  t.eq(icons.textContent, [
    "foo\u200b.js",
    "foo\u200b",
    "foo\u200b.bar\u200b",
    "windows93\u200b.net\u200b",
    "windows93\u200b.net/script\u200b.js\u200b",
  ])

  t.eq(icons.getAttribute("aria-description"), [
    "file", //
    "folder",
    "folder",
    "uri",
    "uri",
  ])
})

test("each", async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest({ connect: true }), {
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
    }),
  )

  t.eq(t.utils.omit(app.reactive.data, ["$computed"]), {
    arr: [{ x: "/derp/foo.js" }, { x: "/derp/" }],
    $ui: {
      icon: {
        "root,[0]": {
          small: false,
          label: true,
          path: { $ref: "/arr/0/x" },
        },
        "root,[1]": {
          small: false,
          label: true,
          path: { $ref: "/arr/1/x" },
        },
      },
    },
  })

  t.eq(Object.keys(app.stage.renderers).slice(0, 8), [
    "/arr",
    "/arr/0/x",
    "/$ui/icon/root,[0]/small",
    "/$ui/icon/root,[0]/label",
    "/arr/1/x",
    "/$ui/icon/root,[1]/small",
    "/$ui/icon/root,[1]/label",
    "/$ui/icon/root,[0]/infos/description",
  ])

  const icons = t.puppet.$$$("ui-icon", { live: true, base: app.el })
  t.eq(icons.textContent, ["foo\u200b.js", "derp\u200b"])

  app.state.arr = [{ x: "bar.txt" }]
  await app

  t.eq(icons.textContent, ["bar\u200b.txt"])
})

test("each", 2, async (t) => {
  const app = await t.utils.decay(
    ui(t.utils.dest({ connect: true }), {
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
    }),
  )

  t.eq(t.utils.omit(app.reactive.data, ["$computed"]), {
    arr: ["/derp/foo.js", "/derp/"],
    $ui: {
      icon: {
        "root,[0]": { small: false, label: true, path: { $ref: "/arr/0" } },
        "root,[1]": { small: false, label: true, path: { $ref: "/arr/1" } },
      },
    },
  })

  t.eq(Object.keys(app.stage.renderers).slice(0, 8), [
    "/arr",
    "/arr/0",
    "/$ui/icon/root,[0]/small",
    "/$ui/icon/root,[0]/label",
    "/arr/1",
    "/$ui/icon/root,[1]/small",
    "/$ui/icon/root,[1]/label",
    "/$ui/icon/root,[0]/infos/description",
  ])

  const icons = t.puppet.$$$("ui-icon", { live: true, base: app.el })
  t.eq(icons.textContent, ["foo\u200b.js", "derp\u200b"])
  t.eq(
    icons.infos.map(({ image }) => image),
    [
      "/42/themes/default/icons/32x32/subtype/javascript.png",
      "/42/themes/default/icons/32x32/places/folder.png",
    ],
  )
  t.eq(icons.getAttribute("aria-description"), [
    "file", //
    "folder",
  ])

  app.state.arr = ["bar.txt"]
  await app

  t.eq(icons.textContent, ["bar\u200b.txt"])
  t.eq(
    icons.infos.map(({ image }) => image),
    ["/42/themes/default/icons/32x32/type/text.png"],
  )
  t.eq(icons.getAttribute("aria-description"), [
    "file", //
  ])

  app.state.arr = ["derp/"]
  await app

  t.eq(icons.textContent, ["derp\u200b"])
  t.eq(
    icons.infos.map(({ image }) => image),
    ["/42/themes/default/icons/32x32/places/folder.png"],
  )
  t.eq(icons.getAttribute("aria-description"), [
    "folder", //
  ])
})
