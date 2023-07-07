import "../traits/transferable.js"
import Component from "../classes/Component.js"
// import isFocusable from "../../fabric/dom/isFocusable.js"
import queueTask from "../../fabric/type/function/queueTask.js"
import configure from "../../core/configure.js"
import { objectifyPlan } from "../normalize.js"

export class Tabs extends Component {
  static plan = {
    tag: "ui-tabs",
    role: "none",
    id: true,

    props: {
      tabTemplate: { type: "object" },
      panelTemplate: { type: "object" },
      side: { type: "string", reflect: true },
      balanced: { type: "boolean", reflect: true },
      closable: false,
      transferable: false,
      current: 0,
      items: {
        type: "array",
        default: [],
        update() {
          if (this.items.length > 0) {
            const max = this.items.length - 1
            if (this.current > max) this.current = max
          } else this.current = 0
        },
      },
    },
  }

  addPanel(data) {
    this.items.push(data)
  }

  removePanel(index) {
    this.items.splice(index, 1)
  }

  selectPanel(index, options) {
    const max = this.items.length - 1
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

  render({ tabTemplate, panelTemplate, transferable, sortable, closable }) {
    const { id } = this

    return [
      {
        scope: "items",
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
                    list: this.items,
                    indexChange: (index) => this.selectPanel(index),
                    sortable,
                    ...transferable,
                  },
                }
              : undefined),

            each: {
              tag: ".ui-tabs__tab",
              role: "tab",
              id: `${id}-tab-{{@index}}`,
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
                  configure(
                    {
                      tag: "span.ui-tabs__trigger",
                      on: {
                        "pointerdown || Space || Enter":
                          "{{selectPanel(@index)}}",
                      },
                    },
                    tabTemplate
                      ? objectifyPlan(tabTemplate)
                      : { content: "{{render(label)}}" },
                  ),
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
            each: configure(
              {
                if: "{{../../current === @index}}",
                tag: ".ui-tabs__panel",
                role: "tabpanel",
                id: `${id}-panel-{{@index}}`,
                // tabIndex: 0,
                // hidden: "{{../../current !== @index}}",
                aria: {
                  labelledby: `${id}-tab-{{@index}}`,
                  expanded: "{{../../current === @index}}",
                },
                // on: {
                //   render(e, target) {
                //     queueTask(() => {
                //       if (
                //         isFocusable(target.firstElementChild) ||
                //         target.firstElementChild?.localName === "label"
                //       ) {
                //         target.tabIndex = -1
                //       }
                //     })
                //   },
                // },
              },
              panelTemplate
                ? objectifyPlan(panelTemplate)
                : { content: "{{render(content)}}" },
            ),
          },
        ],
      },
    ]
  }
}

export default Component.define(Tabs)
