import Component from "../classes/Component.js"
import removeItem from "../../fabric/type/array/removeItem.js"

export class Accordion extends Component {
  static definition = {
    tag: "ui-accordion",
    role: "none",
    id: true,

    props: {
      expanded: {
        type: "array",
        default: [0, 1],
      },
      content: {
        type: "array",
        default: [],
      },
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
    return [
      {
        scope: "content",
        each: [
          {
            tag: "h2.ui-accordion__label",
            content: {
              tag: "button.ui-accordion__button",
              picto: "puzzle",
              aria: {
                controls: `${id}-panel-{{@index}}`,
                expanded: "{{includes(../../../expanded, @index)}}",
              },
              content: "{{render(label)}}",
              click: "{{selectPanel(@index)}}",
            },
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
