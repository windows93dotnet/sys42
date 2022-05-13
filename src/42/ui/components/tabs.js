import Component from "../class/Component.js"
import render from "../render.js"
import joinScope from "../utils/joinScope.js"

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
    // this.currentTab = index
    const proxy = this._.ctx.global.state.getProxy(this._.ctx.scope)
    proxy.currentTab = index
  }

  closeTab(index) {
    const proxy = this._.ctx.global.state.getProxy(this._.ctx.scope)
    proxy.items.splice(index, 1)
    proxy.currentTab = 0
    // this.items.splice(index, 1)
    // this.currentTab = 0
    return false
  }

  $create({ root, content, repeat, ctx }) {
    for (const item of content) {
      this.items.push(item)
    }

    const scopeIsArray = Array.isArray(ctx.global.store.get(ctx.scope))

    const tab = [repeat?.label ?? "{{label|render}}"]

    tab.push({
      tabindex: -1,
      type: "button.btn-clear.btn-picto.close",
      picto: "close",
      run: "closeTab",
      args: ["@index"],
    })

    const def = {
      scope: scopeIsArray ? ctx.scope : joinScope(ctx.scope, "items"),
      content: [
        {
          role: "tablist",
          tabindex: 0,
          repeat: {
            type: ".button",
            role: "tab",
            content: tab,
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

    // setTimeout(() => {
    //   this.querySelector(".close").click()
    // }, 500)
  }
}

export default await Component.define(Tabs)
