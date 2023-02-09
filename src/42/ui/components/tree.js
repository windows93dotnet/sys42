import Component from "../classes/Component.js"
import configure from "../../core/configure.js"
import removeItem from "../../fabric/type/array/removeItem.js"
import { objectifyPlan } from "../normalize.js"

export class Tree extends Component {
  static plan = {
    tag: "ui-tree",
    role: "none",
    id: true,

    aria: {
      multiselectable: "{{multiselectable}}",
    },

    props: {
      itemTemplate: { type: "any" },
      selectable: { type: "any", trait: true },
      selection: [],
      selectionKey: "textContent",
      multiselectable: true,
      expandeds: [],
      items: [],
    },

    traits: {
      navigable: {
        selector: '[role="treeitem"]',
        remember: true,
        shortcuts: {
          next: "ArrowDown",
          prev: "ArrowUp",
          // exitAfter: "Control+ArrowDown || Esc",
          // exitBefore: "Control+ArrowUp",
        },
      },
    },
  }

  async toggleItem(path) {
    if (this.expandeds.includes(path)) {
      removeItem(this.expandeds, path)
    } else {
      this.expandeds.push(path)
      this.busy = this.stage.pendingDone()
      await this.busy
      this.busy = undefined
    }

    this.navigable.update()
  }

  async expandItem(path, navigate) {
    if (this.busy) return

    if (!this.expandeds.includes(path)) {
      this.expandeds.push(path)
      this.busy = this.stage.pendingDone()
      await this.busy
      this.busy = undefined
      this.navigable.update()
    } else if (navigate) {
      this.navigable.next()
    }
  }

  reduceItem(path, navigate) {
    if (this.expandeds.includes(path)) {
      removeItem(this.expandeds, path)
      this.navigable.update()
    } else if (navigate) {
      this.navigable.prev()
    }
  }

  focusUp(path) {
    const index = path.lastIndexOf("-")
    if (index === -1) this.navigable.prev()
    else {
      const sel = `#${this.id}-trigger-${path.slice(0, index)}`
      const el = this.querySelector(sel)
      if (el) el.focus()
    }
  }

  async renderGroup(path = "") {
    const { itemTemplate, id } = this

    return {
      scope: "items",

      // animate: {
      //   from: {
      //     height: 0,
      //     ms: 180,
      //   },
      // },

      each: {
        tag: "li.ui-tree__item",
        role: "none", // TODO: Check if needed

        computed: {
          path: `{{"${path}" + @index}}`,
          expanded: `{{includes(@component/expandeds, path)}}`,
        },

        id: `${id}-item-{{path}}`,

        content: [
          {
            tag: ".ui-tree__label",

            content: [
              {
                if: "{{items}}",
                do: {
                  on: {
                    selector: '.ui-tree__pictos, [role="treeitem"]',
                    repeatable: true,
                    pointerdown: `{{toggleItem(path)}}`,
                    ArrowRight: `{{expandItem(path, true)}}`,
                    ArrowLeft: `{{reduceItem(path, true)}}`,
                  },
                },
                else: {
                  on: {
                    selector: '[role="treeitem"]',
                    repeatable: true,
                    ArrowRight: `{{navigable.next()}}`,
                    ArrowLeft: `{{focusUp(path)}}`,
                  },
                },
              },
              {
                if: "{{items}}",
                tag: ".ui-tree__pictos",
                aria: { hidden: true },
                content: [
                  {
                    tag: "ui-picto.ui-tree__picto-bg",
                    value: "square",
                  },
                  {
                    tag: "ui-picto.ui-tree__picto-bd",
                    value: "square-border",
                  },
                  {
                    tag: "ui-picto.ui-tree__picto-fg",
                    value: "{{expanded ? 'minus-thin' : 'plus-thin'}}",
                  },
                ],
              },
              {
                if: "{{prelabel}}",
                tag: "span.ui-tree__prelabel",
                content: "{{render(prelabel)}}",
              },
              configure(
                { tag: "span.ui-tree__trigger" },
                itemTemplate
                  ? objectifyPlan(itemTemplate)
                  : { content: "{{render(label)}}" },
                {
                  role: "treeitem",
                  id: `${id}-trigger-{{path}}`,
                  aria: {
                    expanded: "{{items ? expanded ?? false : undefined}}",
                  },
                }
              ),
              {
                if: "{{postlabel}}",
                tag: "span.ui-tree__postlabel",
                content: "{{render(postlabel)}}",
              },
              "\n", // Improve textContent
            ],
          },
          {
            if: `{{items && expanded}}`,
            tag: "ul.ui-tree__group",
            role: "group",
            // animate: {
            //   to: {
            //     height: 0,
            //     ms: 180,
            //     initial: false,
            //   },
            // },
            content: `{{renderGroup("${path}" + @index + "-") |> render(^^)}}`,
          },
        ],
      },
    }
  }

  async render({ selectable }) {
    // await this.stage.waitlistTraits.done()
    return {
      selectable: selectable
        ? configure(
            {
              selector: '[role="treeitem"]',
              attributes: {
                class: undefined,
                aria: { selected: true },
              },
              draggerIgnoreItems: true,
              key: "{{../selectionKey}}",
              selection: "{{../selection}}",
            },
            selectable
          )
        : false,
      content: {
        tag: "ul.ui-tree__root.ui-tree__group",
        role: "tree",
        content: "{{renderGroup() |> render(^^)}}",
      },
    }
  }
}

Component.define(Tree)
