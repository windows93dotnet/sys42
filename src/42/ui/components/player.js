import Component from "../classes/Component.js"
import toggleFullscreen from "../../fabric/browser/toggleFullscreen.js"

// @src https://www.30secondsofcode.org/js/s/format-seconds
const formatSeconds = (s, hideHours) => {
  const [hour, minute, second, sign] =
    s >= 0
      ? [s / 3600, (s / 60) % 60, s % 60, ""]
      : [-s / 3600, (-s / 60) % 60, -s % 60, "-"]

  return (
    sign +
    (hideHours ? [minute, second] : [hour, minute, second])
      .map((v) => `${Math.floor(v)}`.padStart(2, "0"))
      .join(":")
  )
}

export class Player extends Component {
  static definition = {
    tag: "ui-player",

    props: {
      path: {
        type: "string",
        reflect: true,
      },
      audio: {
        type: "boolean",
        toView: true,
      },
      waveform: {
        type: "boolean",
        reflect: true,
      },
      elapsed: {
        type: "number",
        default: 0,
      },
      duration: {
        type: "number",
        default: 0,
      },
      paused: {
        type: "boolean",
        default: true,
      },
    },
  }

  render() {
    let rafId

    const loop = () => {
      this.elapsed = this.media.currentTime
      rafId = requestAnimationFrame(loop)
    }

    return {
      tag: ".ui-player__shell",
      entry: "shell",
      content: [
        {
          tag: ".ui-player__stage.inset-shallow",
          content: {
            tag: "video.ui-player__media",
            entry: "media",
            preload: true,
            crossorigin: true,
            src: "{{path}}",
            on: {
              "contextmenu": false,
              "click": "{{playPause()}}",
              "dblclick": "{{toggleFullscreen()}}",
              "error": () => {
                // console.group("error")
                // console.dir(this.media.error.code)
                // console.dir(this.media.error.message)
                // console.groupEnd()
                this.elapsed = 0
                this.duration = 0
              },
              "loadedmetadata": () => {
                this.elapsed = this.media.currentTime
                this.duration = this.media.duration
                this.audio = this.media.videoHeight === 0
              },
              "play || pause": () => {
                this.paused = this.media.paused
                if (this.paused) cancelAnimationFrame(rafId)
                else loop(0)
              },
            },
          },
        },
        {
          tag: "fieldset.unstyled.ui-player__controls",
          disabled: "{{duration === 0}}",
          content: [
            {
              tag: "button.ui-player__play",
              picto: "{{paused ? 'play' : 'pause'}}",
              aria: { label: "{{paused ? 'play' : 'pause'}}" },
              click: "{{playPause()}}",
            },
            {
              tag: ".solid.ui-player__elapsed",
              content: "{{displayTime(elapsed, duration)}}",
            },
            {
              tag: "range.ui-player__track",
              value: "{{elapsed * 1000}}",
              max: "{{duration * 1000}}",
            },
            {
              tag: ".solid.ui-player__duration",
              content: "{{displayTime(duration, duration)}}",
            },
            {
              tag: "button.ui-player__mute",
              picto: "lock-open",
            },
            {
              tag: "range.ui-player__volume",
              disabled: false,
              value: 50,
            },
          ],
        },
      ],
    }
  }

  playPause() {
    if (this.media.paused) this.media.play()
    else this.media.pause()
  }

  toggleFullscreen() {
    toggleFullscreen(this.shell)
  }

  displayTime(time, duration) {
    return formatSeconds(time, duration < 3600)
  }
}

Component.define(Player)
