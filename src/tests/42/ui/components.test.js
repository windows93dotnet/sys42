import test from "../../../42/test.js"
import ui from "../../../42/ui.js"
import Component from "../../../42/ui/class/Component2.js"
// import repaint from "../../../42/fabric/type/promise/repaint.js"

const elements = []
function div() {
  const el = document.createElement("div")
  elements.push(el)
  document.body.append(el)
  return el
}

test.afterEach(() => {
  for (const el of elements) el.remove()
  elements.length = 0
})

// Component.define(
//   class extends Component {
//     static definition = {
//       tag: "ui-test1",
//       class: "derp",
//     }
//   }
// )

// test("render definition attributes", async (t) => {
//   const app = await ui(div(), {
//     type: "ui-test1",
//   })

//   t.is(app.el.innerHTML, '<ui-test1 class="derp"></ui-test1>')
// })

Component.define(
  class extends Component {
    static definition = {
      tag: "ui-test2",
    }

    $render() {
      return {
        content: "hello",
      }
    }
  }
)

test("render using $create", async (t) => {
  const app = await ui(div(), {
    type: "ui-test2",
  })

  t.is(app.el.innerHTML, "<ui-test2>hello</ui-test2>")
})
