import Component from "../classes/Component.js"

export class Grid extends Component {
  static definition = {
    tag: "ui-grid",
    role: "grid",

    aria: {
      multiselectable: "{{multiselectable}}",
    },

    props: {
      template: {
        type: "object",
      },
      selection: {
        type: "array",
        default: [],
      },
      multiselectable: {
        type: "boolean",
        fromView: true,
        default: true,
      },
      content: {
        type: "array",
        default: [],
        update() {
          // console.log("update")
        },
      },
    },
  }

  render({ template }) {
    return [
      {
        scope: "content",
        role: "row",
        each: {
          role: "gridcell",
          aria: { selected: "{{includes(../../../selection, .)}}" },
          // autofocus: "{{@first}}",
          tabIndex: "{{@first ? 0 : -1}}",
          ...(template ?? { render: true }),
        },
      },
    ]
  }
}

Component.define(Grid)
