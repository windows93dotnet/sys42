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

  renderGroup(items) {
    const plan = {
      tag: "ul.ui-tree__group",
      role: "group",
      content: [],
    }

    let first = true

    for (const item of items) {
      const treeitem = {
        tag: "li.ui-tree__item",
        role: "treeitem",
        // aria: { selected: "{{includes(../../selection, .)}}" },
        aria: { selected: "{{log(this)}}" },
        tabIndex: first ? 0 : -1,
        content: [item.label],
      }

      if (item.content) {
        treeitem.aria.expanded = "false"
        treeitem.content.push(this.renderGroup(item.content))
      }

      plan.content.push(treeitem)

      first = false
    }

    return plan
  }

  render({ content }) {
    const plan = this.renderGroup(content)
    plan.role = "tree"
    return [plan]
  }
}

Component.define(Tree)
