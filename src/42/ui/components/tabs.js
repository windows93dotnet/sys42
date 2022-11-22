import Component from "../classes/Component.js"
import isFocusable from "../../fabric/dom/isFocusable.js"
import queueTask from "../../fabric/type/function/queueTask.js"
import hash from "../../fabric/type/any/hash.js"
import getIndex from "../../fabric/dom/getIndex.js"
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

  removeTab(index) {
    this.content.splice(index, 1)
    if (this.current === this.content.length) this.current--
  }

  render() {
    this.id ||= hash(this.ctx.steps)
    const { id } = this

    return [
      {
        scope: "content",
        content: [
          {
            tag: ".ui-tabs__tablist",
            role: "tablist",
            dropzone: true,
            on: {
              async drop(e, target) {
                const { data } = await dt.import(e)
                if (data?.type === "layout") {
                  const tab = target.closest(".ui-tabs__tab")
                  const list = this.reactive.get(this.scope)
                  let index
                  if (tab) {
                    index = getIndex(tab)
                    const { x, width } = tab.getBoundingClientRect()
                    if (e.x > x + width / 2) index++
                    list.splice(index, 0, data.state)
                  } else {
                    index = list.push(data.state) - 1
                  }

                  this.component.current = index
                }
              },
            },
            each: {
              tag: ".ui-tabs__tab._button",
              role: "tab",
              id: `tab-${id}-{{@index}}`,
              tabIndex: "{{../../current === @index ? 0 : -1}}",
              // animate: { opacity: 0, ms: 1000 },
              content: [
                { tag: "span.solid", content: "{{render(label)}}" },
                {
                  tag: "button.ui-tabs__close.pa-0.btn-clear",
                  tabIndex: "{{../../current === @index ? 0 : -1}}",
                  picto: "close",
                  on: {
                    stop: true,
                    click: "{{removeTab(@index)}}",
                  },
                },
              ],
              aria: {
                selected: `{{../../current === @index}}`,
                controls: `panel-${id}-{{@index}}`,
              },
              click: `{{../../current = @index}}`,
              draggable: true,
              on: {
                dragstart(e) {
                  const { scope } = this
                  const state = this.reactive.get(scope, { silent: true })
                  dt.export(e, {
                    effect: ["copy", "move"],
                    data: { type: "layout", scope, state },
                  })
                },
                dragend: `{{e.dataTransfer.dropEffect === "move"
                  ? removeTab(@index) : undefined}}`,
              },
            },
          },
          {
            tag: ".ui-tabs__panels",
            each: {
              if: "{{../../current === @index}}",
              tag: ".ui-tabs__panel",
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
                    if (
                      isFocusable(target.firstElementChild) ||
                      target.firstElementChild?.localName === "label"
                    ) {
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
