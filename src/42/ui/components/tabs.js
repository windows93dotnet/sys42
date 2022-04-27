import Component from "../class/Component.js"
import render from "../render.js"
import joinScope from "../utils/joinScope.js"
// import uid from "../../fabric/uid.js"

class Tabs extends Component {
  static definition = {
    tag: "ui-tabs",
    properties: {
      items: {
        state: true,
        type: "array",
        default: [],
      },
      currentTab: {
        state: true,
        type: "number",
        default: 0,
      },
    },
  }

  setCurrent(index) {
    this.currentTab = index
  }

  $create({ root, content, repeat, ctx }) {
    for (const item of content) {
      this.items.push(item)
    }

    const scopeIsArray = Array.isArray(ctx.global.rack.get(ctx.scope))

    const def = {
      scope: scopeIsArray ? ctx.scope : joinScope(ctx.scope, "items"),
      content: [
        {
          role: "tablist",
          repeat: {
            // type: ".button",
            type: "button",
            role: "tab",
            content: repeat?.label ?? "{{label|render}}",
            aria: { selected: "{{@index === currentTab}}" },
            run: "setCurrent",
            args: ["@index"],
          },
        },
        {
          repeat: {
            class: "{{@index === currentTab ? '' : 'hide'}}",
            role: "tabpanel",
            content: repeat?.content,
          },
        },
      ],
    }

    root.append(render(def, ctx))
  }
}

export default await Component.define(Tabs)
