import Component from "../classes/Component.js"
import removeItem from "../../fabric/type/array/removeItem.js"

export class Accordion extends Component {
  static definition = {
    tag: "ui-accordion",
    role: "none",
    id: true,

    props: {
      multiple: true,
      collapsible: true,
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

  selectPanel(index) {
    if (this.expanded.includes(index)) {
      removeItem(this.expanded, index)
    } else {
      // this.expanded.length = 0
      this.expanded.push(index)
    }
  }

  render() {
    const { id } = this

    const styles = getComputedStyle(this)
    const pictoOpen = styles.getPropertyValue("--picto-open") || "down"
    const pictoClose = styles.getPropertyValue("--picto-close") || "right"

    return [
      {
        scope: "content",
        each: [
          {
            tag: "h2.ui-accordion__label._button",
            content: [
              {
                tag: "ui-picto",
                value: `{{includes(../../../expanded, @index) ? '${pictoOpen}' : '${pictoClose}'}}`,
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
                  expanded: "{{includes(../../../expanded, @index)}}",
                },
                content: {
                  tag: "span.ui-accordion__button__text",
                  content: "{{render(label)}}",
                },
                click: "{{selectPanel(@index)}}",
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
            if: "{{includes(../../../expanded, @index)}}",
            animate: {
              flexBasis: "0%",
              ms: 300,
              start: { overflow: "hidden" },
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
