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

  async toggleItem(addr, e, target) {
    e?.preventDefault()

    if (target?.classList?.contains("ui-tree__pictos")) {
      this.navigable.focus(
        target.parentElement.querySelector('[role="treeitem"]'),
      )
    } else {
      this.navigable.focus(target)
    }

    if (this.expandeds.includes(addr)) {
      removeItem(this.expandeds, addr)
    } else {
      this.expandeds.push(addr)
      this.busy = this.stage.pendingDone()
      await this.busy
      this.busy = undefined
    }

    this.navigable.update()
  }

  async expandItem(addr, options) {
    if (this.busy) return

    if (!this.expandeds.includes(addr)) {
      this.expandeds.push(addr)
      this.busy = this.stage.pendingDone()
      await this.busy
      this.busy = undefined
      this.navigable.update()
    } else if (options?.navigate !== false) {
      this.navigable.next()
    }
  }

  reduceItem(addr, options) {
    if (this.expandeds.includes(addr)) {
      removeItem(this.expandeds, addr)
      this.navigable.update()
    } else if (options?.navigate !== false) {
      this.focusAbove(addr)
    }
  }

  focusUnder() {
    this.navigable.next()
  }

  focusAbove(addr) {
    this.expandeds.sort()
    const index = addr.lastIndexOf("_")

    if (index === -1) {
      if (this.expandeds.length === 0) return void this.navigable.prev()
      const lastExpanded = this.expandeds.at(-1)
      const item = lastExpanded.slice(0, lastExpanded.lastIndexOf("_"))
      const sel = `#${this.id}-group-${item} > li:last-child > .ui-tree__label > [role="treeitem"]`
      const el = this.querySelector(sel)
      if (el) this.navigable.focus(el)
      else this.navigable.prev()
      return
    }

    const parent = addr.slice(0, index)

    for (let i = this.expandeds.length - 1; i >= 0; i--) {
      const item = this.expandeds[i]
      if (item.startsWith(parent + "_") && item < addr) {
        const sel = `#${this.id}-group-${item} > li:last-child > .ui-tree__label > [role="treeitem"]`
        const el = this.querySelector(sel)
        if (el) this.navigable.focus(el)
        break
      } else if (item === parent) {
        const sel = `#${this.id}-item-${item} > .ui-tree__label > [role="treeitem"]`
        const el = this.querySelector(sel)
        if (el) this.navigable.focus(el)
        break
      }
    }
  }

  async renderGroup(addr = "") {
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
          addr: `{{"${addr}" + @index}}`,
          expanded: `{{includes(@component/expandeds, addr)}}`,
        },

        id: `${id}-item-{{addr}}`,

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
                    pointerdown: "{{toggleItem(addr, e, target)}}",
                    ArrowRight: "{{expandItem(addr)}}",
                    ArrowLeft: "{{reduceItem(addr)}}",
                  },
                },
                else: {
                  on: {
                    selector: '[role="treeitem"]',
                    repeatable: true,
                    ArrowRight: "{{focusUnder()}}",
                    ArrowLeft: "{{focusAbove(addr)}}",
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
                  tabIndex: 0,
                  id: `${id}-trigger-{{addr}}`,
                  aria: {
                    expanded: "{{items ? expanded ?? false : undefined}}",
                  },
                },
              ),
              {
                if: "{{postlabel}}",
                tag: "span.ui-tree__postlabel",
                content: "{{render(postlabel)}}",
              },
              "\n", // Improve textContent readability
            ],
          },
          {
            if: `{{items && expanded}}`,
            tag: "ul.ui-tree__group",
            id: `${id}-group-{{addr}}`,
            role: "group",
            // animate: {
            //   to: {
            //     height: 0,
            //     ms: 180,
            //     initial: false,
            //   },
            // },
            content: '{{renderGroup(addr + "_") |> render(^^)}}',
          },
        ],
      },
    }
  }

  async render({ selectable }) {
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
              key: "{{selectionKey}}",
              selection: "{{selection}}",
            },
            selectable,
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

export default Component.define(Tree)
