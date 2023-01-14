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
      content: [],
    },
  }

  addPanel(data) {
    this.content.push(data)
  }

  removePanel(index) {
    this.content.splice(index, 1)
  }

  togglePanel(index, previous) {
    if (index < 0 || index > this.content.length - 1) return

    if (this.expandeds.includes(index)) {
      if (this.collapsible !== true && this.expandeds.length === 1) {
        if (index === this.content.length - 1) {
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
        scope: "content",
        each: [
          {
            tag: "h2.ui-accordion__label._button",
            content: [
              {
                tag: "ui-picto",
                value: `{{includes(../../expandeds, @index) ? '${pictoOpen}' : '${pictoClose}'}}`,
              },
              {
                if: "{{prelabel}}",
                tag: "span.prelabel",
                content: "{{render(prelabel)}}",
              },
              {
                tag: "button.ui-accordion__button",
                aria: {
                  controls: `${id}-panel-{{@index}}`,
                  expanded: "{{includes(../../expandeds, @index)}}",
                },
                content: {
                  tag: "span.ui-accordion__button__text",
                  content: "{{render(label)}}",
                },
                click: "{{togglePanel(@index)}}",
              },
              {
                if: "{{postlabel}}",
                tag: "span.postlabel",
                content: "{{render(postlabel)}}",
              },
            ],
          },
          {
            tag: "section.ui-accordion__panel",
            if: "{{includes(../../expandeds, @index)}}",
            animate: {
              flexBasis: "0%",
              initial: false,
              autoHideScrollbars: true,
            },
            id: `${id}-panel-{{@index}}`,
            content: {
              tag: ".ui-accordion__content",
              content: "{{render(content)}}",
            },
          },
        ],
      },
    ]
  }
}

Component.define(Accordion)
