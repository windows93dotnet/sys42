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

  renderGroup() {
    const { itemTemplate } = this
    return {
      scope: "content",
      each: {
        tag: "li.ui-tree__item",
        role: "treeitem",
        aria: {
          selected: "{{includes(../../selection, .)}}",
          expanded: "{{content ? expanded ?? false : undefined}}",
        },
        tabIndex: "{{@first ? 0 : -1}}",
        content: [
          { ...(itemTemplate ?? { content: "{{label}}" }) }, //
          {
            if: "{{content}}",
            tag: "ul.ui-tree__group",
            role: "group",
            content: "{{renderGroup() |> render(^^)}}",
          },
        ],
      },
    }
  }

  render({ itemTemplate }) {
    this.itemTemplate = itemTemplate
    const plan = {
      scope: "content",
      tag: "ul.ui-tree__group",
      role: "tree",
      each: {
        tag: "li.ui-tree__item",
        role: "treeitem",
        aria: {
          selected: "{{includes(../../selection, .)}}",
          expanded: "{{content ? expanded ?? false : undefined}}",
        },
        tabIndex: "{{@first ? 0 : -1}}",
        content: [
          { ...(itemTemplate ?? { content: "{{label}}" }) }, //
          {
            if: "{{content}}",
            tag: "ul.ui-tree__group",
            role: "group",
            content: "{{renderGroup() |> render(^^)}}",
          },
        ],
      },
    }
    return [plan]
  }
}

Component.define(Tree)
