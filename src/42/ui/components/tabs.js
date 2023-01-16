import Component from "../classes/Component.js"
import isFocusable from "../../fabric/dom/isFocusable.js"
import queueTask from "../../fabric/type/function/queueTask.js"

export class Tabs extends Component {
  static plan = {
    tag: "ui-tabs",
    role: "none",
    id: true,

    props: {
      side: { type: "string", reflect: true },
      balanced: { type: "boolean", reflect: true },
      closable: false,
      transferable: false,
      current: 0,
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

  render({ transferable, sortable, closable }) {
    const { id } = this

    return [
      {
        scope: "content",
        content: [
          {
            tag: ".ui-tabs__tablist",
            role: "tablist",
            aria: {
              orientation:
                '{{includes(["left", "right"], ../side) ? "vertical" : "horizontal"}}',
            },

            ...(transferable || sortable
              ? {
                  transferable: {
                    selector: ":scope > .ui-tabs__tab",
                    list: this.content,
                    indexChange: (index) => this.selectPanel(index),
                    sortable,
                    ...transferable,
                  },
                }
              : undefined),

            each: {
              tag: ".ui-tabs__tab",
              role: "tab",
              id: `tab-${id}-{{@index}}`,
              style: { "--index": "{{@index}}" },
              tabIndex: "{{../../current === @index ? 0 : -1}}",
              aria: {
                selected: "{{../../current === @index}}",
                controls: `${id}-panel-{{@index}}`,
              },
              content: {
                tag: "span.ui-tabs__label",
                content: [
                  {
                    if: "{{prelabel}}",
                    tag: "span.ui-tabs__prelabel",
                    content: "{{render(prelabel)}}",
                  },
                  {
                    tag: "span.ui-tabs__trigger",
                    content: "{{render(label)}}",
                    on: {
                      "pointerdown || Space || Enter":
                        "{{selectPanel(@index)}}",
                    },
                  },
                  {
                    if: "{{postlabel}}",
                    tag: "span.ui-tabs__postlabel",
                    content: "{{render(postlabel)}}",
                  },
                  closable && {
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
