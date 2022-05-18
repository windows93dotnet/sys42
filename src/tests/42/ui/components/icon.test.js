import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

const elements = []
function div(connect = true) {
  const el = document.createElement("div")
  elements.push(el)
  if (connect) document.body.append(el)
  return el
}

test.afterEach(() => {
  for (const el of elements) el.remove()
  elements.length = 0
})

test.suite.timeout(1000)

function clean([str]) {
  return str.replace(/^\s*/gm, "").replace(/\n/g, "")
}

test("html", async (t) => {
  const app = await ui(div(), {
    type: "ui-icon",
    path: "/script.js",
  })

  t.is(
    app.el.innerHTML,
    clean`
    <ui-icon path="/script.js" label="" tabindex="0" aria-description="file" role="button">
      <div aria-hidden="true" class="ui-icon__figure">
        <img class="ui-icon__image" src="/42/themes/default/icons/subtype/javascript.png">
        <div class="ui-icon__mask" style="-webkit-mask-image: url(&quot;/42/themes/default/icons/subtype/javascript.png&quot;);"></div>
      </div>
      <!--[when]-->
      <div class="ui-icon__label">
        <svg><rect></rect></svg>
        <span>script</span>
        <!--[when]-->
        <span>\u200b.js</span>
      </div>
    </ui-icon>`
  )
})

test("infos", async (t) => {
  const app = await ui(div(), [
    {
      type: "ui-icon",
      path: "/derp/foo.js",
    },
    {
      type: "ui-icon",
      path: "/derp/foo/",
    },
    {
      type: "ui-icon",
      path: "/derp/foo.bar/",
    },
    {
      type: "ui-icon",
      path: "https://www.windows93.net/",
    },
    {
      type: "ui-icon",
      path: "https://www.windows93.net/script.js",
    },
  ])

  const icons = app.batch("ui-icon")
  const { infos } = icons

  t.eq(icons.ariaDescription, [
    "file", //
    "folder",
    "folder",
    "uri",
    "uri",
  ])

  t.eq(icons.textContent, [
    "foo\u200b.js",
    "foo",
    "foo\u200b.bar",
    "windows93\u200b.net",
    "windows93\u200b.net/script\u200b.js",
  ])

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
})

test("repeat", async (t) => {
  const app = await ui(div(), {
    content: {
      scope: "arr",
      repeat: {
        type: "ui-icon",
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

  const icons = app.batch("ui-icon")
  t.eq(icons.textContent, ["foo\u200b.js", "derp"])
})

test("repeat", 2, async (t) => {
  const app = await ui(div(), {
    content: {
      scope: "arr",
      repeat: {
        type: "ui-icon",
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

  const icons = app.batch("ui-icon")
  t.eq(icons.textContent, ["foo\u200b.js", "derp"])
})
