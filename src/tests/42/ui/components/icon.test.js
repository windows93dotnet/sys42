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

// test("infos", async (t) => {
//   const app = await ui(div(), [
//     {
//       type: "ui-icon",
//       path: "/42/os/cmd/open.cmd.js",
//     },
//     {
//       type: "ui-icon",
//       path: "/42/os/cmd/",
//     },
//     {
//       type: "ui-icon",
//       path: "https://www.windows93.net/",
//     },
//     {
//       type: "ui-icon",
//       path: "https://www.windows93.net/script.js",
//     },
//   ])

//   const icons = app.batch("ui-icon")

//   // t.eq(icons.path, [
//   //   "/42/os/cmd/open.cmd.js",
//   //   "/42/os/cmd/",
//   //   "https://www.windows93.net/",
//   // ])
//   t.eq(icons.infos)
// })
