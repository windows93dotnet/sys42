import Component from "../classes/Component.js"

export class Tree extends Component {
  static plan = {
    tag: "ui-tree",
    role: "none",

    aria: {
      multiselectable: "{{multiselectable}}",
    },

    traits: {
      selectable: {
        draggerIgnoreItems: true,
        class: false,
        key: "{{selectionKey}}",
        selection: "{{selection}}",
      },
    },

    props: {
      itemTemplate: { type: "object" },
      selection: [],
      selectionKey: "textContent",
      multiselectable: true,
      content: [],
    },
  }

  toggleItem(item) {
    item.expanded = !item.expanded
  }

  renderGroup(loc) {
    const { itemTemplate } = this
    loc = String(loc)
    return {
      scope: "content",
      state: { loc },
      each: {
        tag: "li.ui-tree__item",
        role: "treeitem",
        aria: {
          selected: "{{includes(../../selection, .)}}",
          expanded: "{{content ? expanded ?? false : undefined}}",
        },
        tabIndex: "{{@first ? 0 : -1}}",
        content: [
          {
            ...(itemTemplate ?? {
              tag: ".ui-tree__label",
              content: "{{render(label)}}",
              click: "{{toggleItem(.)}}",
            }),
          },
          {
            if: "{{content && expanded}}",
            tag: "ul.ui-tree__group",
            role: "group",
            animate: {
              height: "0px",
              // ms: 1000,
              initial: false,
            },
            content:
              "{{renderGroup(../loc + '/' + @index, content) |> render(^^)}}",
          },
        ],
      },
    }
  }

  render({ itemTemplate }) {
    this.itemTemplate = itemTemplate
    return [
      {
        tag: "ul.ui-tree__group",
        role: "tree",
        content: "{{renderGroup('', content) |> render(^^)}}",
      },
    ]
  }
}

Component.define(Tree)
