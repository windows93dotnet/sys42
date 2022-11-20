import Component from "../classes/Component.js"
import uid from "../../core/uid.js"

export class Tabs extends Component {
  static definition = {
    tag: "ui-tabs",
    role: "none",

    props: {
      currentTab: {
        type: "number",
        default: 0,
      },
    },
  }

  render({ content }) {
    const tabs = []
    const panels = []

    for (let i = 0, l = content.length; i < l; i++) {
      const item = content[i]

      const tab = {
        tag: "button.ui-tabs__tab",
        role: "tab",
        id: uid(),
        content: item.label,
        aria: { selected: `{{ currentTab === ${i} }}` },
        click: `{{ currentTab = ${i} }}`,
      }

      const panel = {
        tag: ".ui-tabs__panel._inset",
        role: "tabpanel",
        id: uid(),
        style: { display: `{{ currentTab === ${i} ? "block" : "none" }}` },
        content: item.content,
        aria: {},
      }

      tab.aria.controls = panel.id
      panel.aria.labelledby = tab.id

      tabs.push(tab)
      panels.push(panel)
    }

    return [
      {
        tag: ".ui-tabs__tablist",
        role: "tablist",
        content: tabs,
      },
      {
        tag: ".ui-tabs__panels.outset.pa-sm",
        content: panels,
      },
    ]
  }
}

Component.define(Tabs)
