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
      items: [],
    },
  }

  toggleItem(item) {
    item.expanded = !item.expanded
  }

  async renderGroup() {
    const { itemTemplate } = this
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
        role: "treeitem",
        aria: {
          // selected: "{{includes(../../selection, .)}}",
          expanded: "{{items ? expanded ?? false : undefined}}",
        },
        // tabIndex: "{{@first ? 0 : -1}}",
        tabIndex: 0,
        content: [
          {
            tag: ".ui-tree__label",
            content: [
              {
                if: "{{items}}",
                tag: ".ui-tree__pictos",
                on: { pointerdown: "{{toggleItem(.)}}" },
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
              {
                tag: "span.ui-tree__trigger",
                on: { pointerdown: "{{toggleItem(.)}}" },
                content: {
                  ...(itemTemplate ?? {
                    tag: "span.ui-tree__trigger-text",
                    content: "{{render(label)}}",
                  }),
                },
              },
              {
                if: "{{postlabel}}",
                tag: "span.ui-tree__postlabel",
                content: "{{render(postlabel)}}",
              },
            ],
          },
          {
            if: "{{items && expanded}}",
            tag: "ul.ui-tree__group",
            role: "group",
            // animate: {
            //   to: {
            //     height: 0,
            //     ms: 180,
            //     initial: false,
            //   },
            // },
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
