import Component from "../classes/Component.js"
import configure from "../../core/configure.js"
import { objectifyPlan } from "../normalize.js"

export class Tree extends Component {
  static plan = {
    tag: "ui-tree",
    role: "none",

    aria: {
      multiselectable: "{{multiselectable}}",
    },

    props: {
      itemTemplate: { type: "any" },
      selectable: { type: "any", trait: true },
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
        role: "none", // TODO: Check if needed
        content: [
          {
            tag: ".ui-tree__label",
            content: [
              {
                if: "{{items}}",
                tag: ".ui-tree__pictos",
                aria: { hidden: true },
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
              configure(
                {
                  tag: "span.ui-tree__trigger",
                  tabIndex: "{{@first ? 0 : -1}}",
                  on: { pointerdown: "{{toggleItem(.)}}" },
                },
                itemTemplate
                  ? objectifyPlan(itemTemplate)
                  : { content: "{{render(label)}}" },
                {
                  role: "treeitem",
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

  render({ selectable }) {
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
