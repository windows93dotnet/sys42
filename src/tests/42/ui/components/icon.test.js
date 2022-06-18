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

function clean([str]) {
  return str.replace(/^\s*/gm, "").replace(/\n/g, "")
}

test("html", async (t) => {
  const app = await ui(tmp(), {
    tag: "ui-icon",
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

test.only("infos", async (t) => {
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

test.skip("repeat", async (t) => {
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

  t.eq(Object.keys(app.ctx.global.renderers), [
    "arr",
    "arr.0.x",
    "arr.1.x",
    "arr.0.path",
    "arr.1.path",
    "arr.0.infos.description",
    "arr.1.infos.description",
    "arr.0.infos.image",
    "arr.0.infos.label",
    "arr.0.infos.stem",
    "arr.0.infos.isFile",
    "arr.0.infos.ext",
    "arr.1.infos.image",
    "arr.1.infos.label",
    "arr.1.infos.stem",
    "arr.1.infos.isFile",
    "arr.1.infos.ext",
  ])

  const icons = app.batch("ui-icon", { live: true })
  t.eq(icons.textContent, ["foo\u200b.js", "derp"])

  app.data.arr = [{ x: "bar.txt" }]

  await test.utils.repaint()

  t.eq(icons.textContent, ["bar\u200b.txt"])
})

// test("repeat", 2, async (t) => {
//   const app = await ui(div(), {
//     content: {
//       scope: "arr",
//       repeat: {
//         tag: "ui-icon",
//         path: "{{.}}",
//       },
//     },
//     data: {
//       arr: [
//         "/derp/foo.js", //
//         "/derp/",
//       ],
//     },
//   })

//   const icons = app.batch("ui-icon")
//   t.eq(icons.textContent, ["foo\u200b.js", "derp"])
// })
