import Component from "../classes/Component.js"
import isFocusable from "../../fabric/dom/isFocusable.js"
import queueTask from "../../fabric/type/function/queueTask.js"
import hash from "../../fabric/type/any/hash.js"
import getIndex from "../../fabric/dom/getIndex.js"
import moveItem from "../../fabric/type/array/moveItem.js"
import dt from "../../core/dt.js"

const _isSorting = Symbol("LayoutPanel._isSorting")

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

  onDragStart(e, index) {
    const { id } = this
    const path = `${this.ctx.scope}/content/${index}`
    const state = this.ctx.reactive.get(path)
    const data = { type: "layout", id, index, state }
    dt.export(e, { effect: ["copy", "move"], data })
  }

  onDragEnd(e, index) {
    if (this[_isSorting]) return (this[_isSorting] = false)
    if (e.dataTransfer.dropEffect === "move") this.removeTab(index)
  }

  async onDrop(e) {
    const { data } = await dt.import(e)
    if (data?.type === "layout") {
      const tab = e.target.closest(".ui-tabs__tab")
      let index

      if (data.id === this.id) this[_isSorting] = true

      if (tab) {
        index = getIndex(tab)
        if (data.id === this.id && data.index === index) return
        const { x, width } = tab.getBoundingClientRect()
        if (e.x > x + width / 2) index++
      } else {
        index = this.content.length
      }

      if (this[_isSorting]) {
        if (index > this.content.length - 1) index = this.content.length - 1
        moveItem(this.content, data.index, index)
        this.current = index
      } else {
        this.content.splice(index, 0, data.state)
        this.current = index
      }
    }
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
              drop: "{{onDrop(e, target)}}",
            },
            each: {
              tag: ".ui-tabs__tab",
              role: "tab",
              id: `tab-${id}-{{@index}}`,
              tabIndex: "{{../../current === @index ? 0 : -1}}",
              // animate: { opacity: 0, ms: 1000 },
              animate: {
                clipPath: "inset(0 0 100% 0)",
                translate: "0 100%",
                ms: 300,
              },
              content: [
                { tag: "span.ui-tabs__label", content: "{{render(label)}}" },
                {
                  tag: "button.ui-tabs__close._pa-0._btn-clear",
                  tabIndex: "{{../../current === @index ? 0 : -1}}",
                  picto: "close",
                  on: { stop: true, click: "{{removeTab(@index)}}" },
                },
              ],
              aria: {
                selected: `{{../../current === @index}}`,
                controls: `panel-${id}-{{@index}}`,
              },
              click: `{{../../current = @index}}`,
              draggable: true,
              on: {
                dragstart: "{{onDragStart(e, @index)}}",
                dragend: "{{onDragEnd(e, @index)}}",
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
