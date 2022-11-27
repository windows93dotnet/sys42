import Component from "../classes/Component.js"
import isFocusable from "../../fabric/dom/isFocusable.js"
import queueTask from "../../fabric/type/function/queueTask.js"
import hash from "../../fabric/type/any/hash.js"

export class Tabs extends Component {
  static definition = {
    tag: "ui-tabs",
    role: "none",

    props: {
      vertical: {
        type: "boolean",
        reflect: true,
      },
      balanced: {
        type: "boolean",
        reflect: true,
      },
      current: {
        type: "number",
        default: 0,
      },
      content: {
        type: "array",
        default: [],
        update() {
          const max = this.content.length - 1
          if (this.current > max) this.current = max
        },
      },
    },
  }

  addTab(data) {
    this.content.push(data)
  }

  removeTab(index) {
    this.content.splice(index, 1)
  }

  selectTab(index, options) {
    const max = this.content.length - 1
    if (index > max) index = max
    else if (index < 0) index = 0

    this.current = index

    if (options?.focus === false) return
    queueTask(() => {
      this.querySelector(`#tab-${this.id}-${index}`)?.focus({
        preventScroll: true,
      })
    })
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
            aria: {
              orientation: '{{../vertical ? "vertical" : "horizontal" }}',
            },

            transferable: {
              items: ":scope > .ui-tabs__tab",
              list: this.content,
              reactive: this.ctx.reactive,
              indexChange: (index) => this.selectTab(index),
            },

            each: {
              tag: ".ui-tabs__tab",
              role: "tab",
              id: `tab-${id}-{{@index}}`,
              dataset: { index: "{{@index}}" },
              tabIndex: "{{../../current === @index ? 0 : -1}}",
              // animate: {
              //   clipPath: "inset(0 0 100% 0)",
              //   translate: "0 100%",
              //   ms: 300,
              // },
              content: {
                tag: "span.ui-tabs__container",
                content: [
                  { tag: "span.ui-tabs__label", content: "{{render(label)}}" },
                  {
                    tag: "button.ui-tabs__close._pa-0._btn-clear",
                    tabIndex: "{{../../current === @index ? 0 : -1}}",
                    picto: "close",
                    on: {
                      stop: true,
                      click: "{{removeTab(@index)}}",
                    },
                  },
                ],
              },
              aria: {
                selected: "{{../../current === @index}}",
                controls: `panel-${id}-{{@index}}`,
              },
              on: {
                "pointerdown || Space || Enter": "{{selectTab(@index)}}",
              },
            },
          },
          {
            tag: ".ui-tabs__panels",
            each: {
              // if: "{{../../current === @index}}",
              tag: ".ui-tabs__panel",
              role: "tabpanel",
              id: `panel-${id}-{{@index}}`,
              content: "{{render(content)}}",
              tabIndex: 0,
              hidden: "{{../../current !== @index}}",
              aria: {
                labelledby: `tab-${id}-{{@index}}`,
                expanded: "{{../../current === @index}}",
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
