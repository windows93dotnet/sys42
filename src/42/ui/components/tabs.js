import Component from "../class/Component.js"
import render from "../render.js"
import uid from "../../fabric/uid.js"

class Tabs extends Component {
  static definition = {
    tag: "ui-tabs",
  }

  setCurrent(index) {
    this._.ctx.global.state.proxy.currentTab = index
  }

  $create({ root, content, label, ctx }) {
    const id = uid()

    ctx.global.state.proxy.currentTab ??= 0

    const def = [
      {
        type: "ul",
        role: "tablist",
        repeat: {
          type: "li",
          role: "none",
          content: {
            type: "button",
            role: "tab",
            id: `tab-${id}-{{@index}}`,
            label,
            run: "setCurrent",
            args: ["@index"],
            aria: { selected: "{{@index === currentTab}}" },
          },
        },
      },
      {
        type: "section",
        role: "tabpanel",
        aria: { labeledby: `tab-${id}-{{currentTab}}` },
        content,
      },
    ]

    root.append(render(def, ctx))

    // setTimeout(() => {
    //   this.setCurrent(1)
    // }, 1000)
  }
}

export default await Component.define(Tabs)
