import Component from "../classes/Component.js"
import isFocusable from "../../fabric/dom/isFocusable.js"
import queueTask from "../../fabric/type/function/queueTask.js"

export class Tabs extends Component {
  static definition = {
    tag: "ui-tabs",
    role: "none",
    id: true,

    props: {
      side: {
        type: "string",
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
          if (this.content.length > 0) {
            const max = this.content.length - 1
            if (this.current > max) this.current = max
          } else this.current = 0
        },
      },
    },
  }

  addPanel(data) {
    this.content.push(data)
  }

  removePanel(index) {
    this.content.splice(index, 1)
  }

  selectPanel(index, options) {
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
    const { id } = this
    console.log(id)
    return [
      {
        scope: "content",
        content: [
          {
            tag: ".ui-tabs__tablist",
            role: "tablist",
            aria: {
              orientation:
                '{{ includes(["left", "right"], ../side) ? "vertical" : "horizontal" }}',
            },

            transferable: {
              selector: ":scope > .ui-tabs__tab",
              list: this.content,
              indexChange: (index) => this.selectPanel(index),
            },

            each: {
              tag: ".ui-tabs__tab",
              role: "tab",
              id: `tab-${id}-{{@index}}`,
              style: { "--index": "{{@index}}" },
              tabIndex: "{{../../current === @index ? 0 : -1}}",
              content: {
                tag: "span.ui-tabs__container",
                content: [
                  { tag: "span.ui-tabs__label", content: "{{render(label)}}" },
                  {
                    if: "{{postlabel}}",
                    tag: "span",
                    content: "{{render(postlabel)}}",
                  },
                  {
                    tag: "button.ui-tabs__close",
                    tabIndex: "{{../../current === @index ? 0 : -1}}",
                    picto: "close",
                    on: {
                      stop: true,
                      click: "{{removePanel(@index)}}",
                    },
                  },
                ],
              },
              aria: {
                selected: "{{../../current === @index}}",
                controls: `${id}-panel-{{@index}}`,
              },
              on: {
                "pointerdown || Space || Enter": "{{selectPanel(@index)}}",
              },
            },
          },
          {
            tag: ".ui-tabs__panels",
            each: {
              if: "{{../../current === @index}}",
              tag: ".ui-tabs__panel",
              role: "tabpanel",
              id: `${id}-panel-{{@index}}`,
              content: "{{render(content)}}",
              tabIndex: 0,
              // hidden: "{{../../current !== @index}}",
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
