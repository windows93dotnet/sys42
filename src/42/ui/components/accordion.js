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
      expanded: [0],
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

    if (this.expanded.includes(index)) {
      if (this.collapsible !== true && this.expanded.length === 1) {
        if (index === this.content.length - 1) {
          this.togglePanel(index - 1, index)
        } else this.togglePanel(index + 1, index)
      } else {
        removeItem(this.expanded, index)
      }
    } else {
      if (this.multiple !== true) this.expanded.length = 0
      this.expanded.push(index)
    }

    if (previous !== undefined) removeItem(this.expanded, previous)
  }

  render() {
    const { id } = this

    const styles = getComputedStyle(this)
    const pictoOpen = styles.getPropertyValue("--picto-open") || "down"
    const pictoClose = styles.getPropertyValue("--picto-close") || "right"

    if (this.multiple !== true) this.expanded.length = 1

    return [
      {
        scope: "content",
        each: [
          {
            tag: "h2.ui-accordion__label._button",
            content: [
              {
                tag: "ui-picto",
                value: `{{includes(../../expanded, @index) ? '${pictoOpen}' : '${pictoClose}'}}`,
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
                  expanded: "{{includes(../../expanded, @index)}}",
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
            if: "{{includes(../../expanded, @index)}}",
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
