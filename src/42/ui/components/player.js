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
          ready: true,
          derp: 5,
        },
      },
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
            load(e) {
              console.log("load", e)
              // this.ready = false
            },
            loadedmetadata(e) {
              console.log("loadedmetadata", e)
              // this.ready = true
              // console.log(this.ctx.el)
              // this.session.ready = true
            },
          },
        },
      },
      {
        tag: ".ui-player__controls",
        content: [
          {
            tag: "button.ui-player__play",
            // disabled: "{{session.ready ? false : true}}",
            disabled: "{{log(session)}}",
            picto: "play",
          },
          {
            tag: "range.ui-player__track",
            disabled: "{{session.ready ? false : true}}",
            value: 0,
          },
          {
            tag: "button.ui-player__mute",
            disabled: "{{session.ready ? false : true}}",
            picto: "lock-open",
          },
          {
            tag: "range.ui-player__volume",
            disabled: "{{session.ready ? false : true}}",
            value: 50,
          },
        ],
      },
    ],
  }
}

Component.define(Player)
