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
    },
  }

  selectTab(target, blob) {
    console.log(888, target, blob)
  }

  $create({ root, repeat, ctx }) {
    // this.items = ctx.global.rack.get(ctx.scope)
    this.items = ctx.global.state.getThisArg(ctx.scope)

    const content = {
      scope: joinScope(ctx.scope, "items"),
      repeat: {
        type: "button",
        run: "selectTab",
        args: ["e.target", "file"],
        label: "{{@index}}" + repeat.label,
      },
    }

    root.append(render(content, ctx))
  }
}

export default await Component.define(Tabs)
