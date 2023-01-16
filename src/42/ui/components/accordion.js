import Component from "../classes/Component.js"
import removeItem from "../../fabric/type/array/removeItem.js"

export class Accordion extends Component {
  static plan = {
    tag: "ui-accordion",
    role: "none",
    id: true,

    props: {
      multiple: true,
      collapsible: false,
      expandeds: [0],
      items: [],
    },
  }

  addPanel(data) {
    this.items.push(data)
  }

  removePanel(index) {
    this.items.splice(index, 1)
  }

  togglePanel(index, previous) {
    if (index < 0 || index > this.items.length - 1) return

    if (this.expandeds.includes(index)) {
      if (this.collapsible !== true && this.expandeds.length === 1) {
        if (index === this.items.length - 1) {
          this.togglePanel(index - 1, index)
        } else this.togglePanel(index + 1, index)
      } else {
        removeItem(this.expandeds, index)
      }
    } else {
      if (this.multiple !== true) this.expandeds.length = 0
      this.expandeds.push(index)
    }

    if (previous !== undefined) removeItem(this.expandeds, previous)
  }

  render() {
    const { id } = this

    const styles = getComputedStyle(this)
    const pictoOpen = styles.getPropertyValue("--picto-open") || "down"
    const pictoClose = styles.getPropertyValue("--picto-close") || "right"

    if (this.multiple !== true) this.expandeds.length = 1

    return [
      {
        scope: "items",
        each: [
          {
            tag: "h2.ui-accordion__label",
            content: [
              {
                tag: "ui-picto",
                value: `{{includes(../../expandeds, @index) ? '${pictoOpen}' : '${pictoClose}'}}`,
                click: "{{togglePanel(@index)}}",
              },
              {
                if: "{{prelabel}}",
                tag: "span.ui-accordion__prelabel",
                content: "{{render(prelabel)}}",
              },
              {
                tag: "button.ui-accordion__trigger",
                aria: {
                  controls: `${id}-panel-{{@index}}`,
                  expanded: "{{includes(../../expandeds, @index)}}",
                },
                content: {
                  tag: "span.ui-accordion__trigger__text",
                  content: "{{render(label)}}",
                },
                click: "{{togglePanel(@index)}}",
              },
              {
                if: "{{postlabel}}",
                tag: "span.ui-accordion__postlabel",
                content: "{{render(postlabel)}}",
              },
            ],
          },
          {
            tag: "section.ui-accordion__panel",
            if: "{{includes(../../expandeds, @index)}}",
            animate: {
              flexBasis: "0%",
              ms: 180,
              initial: false,
              autoHideScrollbars: true,
            },
            id: `${id}-panel-{{@index}}`,
            class: {
              "ui-accordion__panel--text": "{{getType(content) === 'string'}}",
            },
            content: {
              tag: ".ui-accordion__content",
              content: "{{render(content)}}",
            },
            render: "{{plan}}",
          },
        ],
      },
    ]
  }
}

Component.define(Accordion)
