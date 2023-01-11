import Component from "../classes/Component.js"

export class Accordion extends Component {
  static definition = {
    tag: "ui-accordion",
    role: "none",
    id: true,

    props: {
      current: {
        type: "number",
        default: 0,
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
    console.log(index)
  }

  render() {
    const { id } = this
    return [
      {
        scope: "content",
        each: [
          {
            tag: "h2.ui-accordion__label.button.pa-0",
            content: {
              tag: "button.ui-accordion__button.btn-clear",
              aria: {
                controls: `${id}-panel-{{@index}}`,
                expanded: "{{../../current === @index}}",
              },
              content: "{{render(label)}}",
            },
          },
          {
            tag: "section.ui-accordion__panel",
            id: `${id}-panel-{{@index}}`,
            content: "{{render(content)}}",
          },
        ],
      },
    ]
  }
}

Component.define(Accordion)
