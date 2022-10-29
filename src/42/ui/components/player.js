import Component from "../classes/Component.js"

export class Player extends Component {
  static definition = {
    tag: "ui-player",

    props: {
      path: {
        type: "string",
        reflect: true,
      },
      ready: false,
    },

    content: [
      {
        tag: ".ui-player__stage.inset-shallow",
        content: {
          tag: "video",
          // controls: true,
          src: "{{path}}",
          on: {
            error(e) {
              console.log("error", e)
              // this.ready = false
            },
            loadedmetadata(e) {
              console.log("loadedmetadata", e)
              // this.ready = true
            },
          },
        },
      },
      {
        tag: ".ui-player__controls",
        content: [
          {
            tag: "button.ui-player__play",
            disabled: "{{!ready}}",
            picto: "play",
          },
          {
            tag: "range.ui-player__track",
            disabled: "{{!ready}}",
            value: 0,
          },
          {
            tag: "button.ui-player__mute",
            disabled: "{{!ready}}",
            picto: "lock-open",
          },
          {
            tag: "range.ui-player__volume",
            disabled: "{{!ready}}",
            value: 50,
          },
        ],
      },
    ],
  }
}

Component.define(Player)
