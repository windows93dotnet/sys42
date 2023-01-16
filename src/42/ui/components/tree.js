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

  async renderGroup() {
    const { itemTemplate } = this
    return {
      scope: "content",

      animate: {
        from: {
          height: "0px",
          initial: false,
        },
      },

      each: {
        tag: "li.ui-tree__item",
        role: "treeitem",
        aria: {
          selected: "{{includes(../../selection, .)}}",
          expanded: "{{content ? expanded ?? false : undefined}}",
        },
        tabIndex: "{{@first ? 0 : -1}}",
        content: [
          // {
          //   ...(itemTemplate ?? {
          //     tag: ".ui-tree__trigger",
          //     content: "{{render(label)}}",
          //     click: "{{toggleItem(.)}}",
          //   }),
          // },
          {
            tag: ".ui-tree__label",
            content: [
              {
                if: "{{prelabel}}",
                tag: "span.ui-tree__prelabel",
                content: "{{render(prelabel)}}",
              },
              {
                tag: "span.ui-tree__trigger",
                content: "{{render(label)}}",
                click: "{{toggleItem(.)}}",
              },
              {
                if: "{{postlabel}}",
                tag: "span.ui-tree__postlabel",
                content: "{{render(postlabel)}}",
              },
            ],
          },
          {
            if: "{{content && expanded}}",
            tag: "ul.ui-tree__group",
            role: "group",
            animate: {
              to: {
                height: "0px",
                initial: false,
              },
            },
            content: "{{renderGroup() |> render(^^)}}",
          },
        ],
      },
    }
  }

  render({ itemTemplate }) {
    this.itemTemplate = itemTemplate
    return [
      {
        tag: "ul.ui-tree__root.ui-tree__group",
        role: "tree",
        content: "{{renderGroup() |> render(^^)}}",
      },
    ]
  }
}

Component.define(Tree)
