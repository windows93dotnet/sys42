import Component from "../classes/Component.js"

export class Player extends Component {
  static definition = {
    tag: "ui-player",

    props: {
      path: {
        type: "string",
        reflect: true,
      },
      session: {
        type: "object",
        default: {
          ready: false,
        },
      },
    },

    content: [
      {
        tag: ".ui-player__stage.inset-shallow",
        content: {
          tag: "video",
          entry: "media",
          // controls: true,
          src: "{{path}}",
          on: {
            error() {
              // console.log("error", e, this)
              console.log("error", this.component.media)
              this.component.session.ready = false
            },
            loadedmetadata: `{{log(e.type); session.ready = true}}`,
          },
        },
      },
      {
        tag: ".ui-player__controls",
        content: [
          {
            tag: "button.ui-player__play",
            disabled: "{{!session.ready}}",
            picto: "play",
          },
          {
            tag: "range.ui-player__track",
            disabled: "{{!session.ready}}",
            value: 0,
          },
          {
            tag: "button.ui-player__mute",
            disabled: "{{!session.ready}}",
            picto: "lock-open",
          },
          {
            tag: "range.ui-player__volume",
            disabled: "{{!session.ready}}",
            value: 50,
          },
        ],
      },
    ],
  }

  setup() {
    console.log(888, this.media)
  }
}

Component.define(Player)
