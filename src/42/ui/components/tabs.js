import Component from "../classes/Component.js"
import uid from "../../core/uid.js"
import isFocusable from "../../fabric/dom/isFocusable.js"
import queueTask from "../../fabric/type/function/queueTask.js"
import dt from "../../core/dt.js"

export class Tabs extends Component {
  static definition = {
    tag: "ui-tabs",
    role: "none",

    props: {
      current: {
        type: "number",
        default: 0,
      },
      content: { type: "array", default: [] },
    },
  }

  render() {
    const id = uid()

    return [
      {
        scope: "content",
        content: [
          {
            tag: ".ui-tabs__tablist",
            role: "tablist",
            dropzone: true,
            on: {
              async drop(e) {
                const { data, effect } = await dt.import(e)
                if (data) {
                  console.log("drop", effect, data.id === id)
                }
              },
            },
            each: {
              tag: "button.ui-tabs__tab",
              role: "tab",
              id: `tab-${id}-{{@index}}`,
              tabIndex: "{{../../current === @index ? 0 : -1}}",
              content: "{{render(label)}}",
              aria: {
                selected: `{{../../current === @index}}`,
                controls: `panel-${id}-{{@index}}`,
              },
              click: `{{../../current = @index}}`,
              draggable: true,
              on: {
                dragstart(e) {
                  dt.export(e, {
                    effect: "move",
                    image: true,
                    data: { id, hello: "world" },
                  })
                },
              },
            },
          },
          {
            tag: ".ui-tabs__panels.outset.pa-sm",
            each: {
              if: "{{../../current === @index}}",
              tag: ".ui-tabs__panel._inset",
              role: "tabpanel",
              id: `panel-${id}-{{@index}}`,
              content: "{{render(content)}}",
              tabIndex: 0,
              aria: {
                labelledby: `tab-${id}-{{@index}}`,
              },
              on: {
                render(e, target) {
                  queueTask(() => {
                    if (isFocusable(target.firstElementChild)) {
                      target.tabIndex = -1
                    }
                  })
                },
              },
            },
          },
        ],
      },
    ]
  }
}

Component.define(Tabs)
