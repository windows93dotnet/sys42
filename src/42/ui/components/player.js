import Component from "../classes/Component.js"
import defer from "../../fabric/type/promise/defer.js"
import toggleFullscreen from "../../fabric/browser/toggleFullscreen.js"

// @src https://www.30secondsofcode.org/js/s/format-seconds
const formatTime = (time, hideHours) => {
  const [hour, minute, second, sign] =
    time >= 0
      ? [time / 3600, (time / 60) % 60, time % 60, ""]
      : [-time / 3600, (-time / 60) % 60, -time % 60, "-"]

  return (
    sign +
    (hideHours ? [minute, second] : [hour, minute, second])
      .map((v) => `${Math.floor(v)}`.padStart(2, "0"))
      .join(":")
  )
}

// @src https://www.30secondsofcode.org/js/s/format-duration
const formatDuration = (ms) => {
  if (ms < 0) ms = -ms
  const time = {
    d: Math.floor(ms / 86_400_000),
    h: Math.floor(ms / 3_600_000) % 24,
    m: Math.floor(ms / 60_000) % 60,
    s: ((ms / 1000) % 60).toFixed(3),
  }
  return Object.entries(time)
    .filter((val) => val[1] !== 0)
    .map(([key, val]) => `${val}${key}`)
    .join(" ")
}

export class Player extends Component {
  static plan = {
    tag: "ui-player",

    props: {
      path: {
        type: "string",
        reflect: true,
      },
      autoplay: {
        type: "boolean",
        default: false,
        reflect: true,
      },
      audio: {
        type: "boolean",
        reflect: true,
      },
      waveform: {
        type: "boolean",
        reflect: true,
      },
      paused: {
        type: "boolean",
        default: true,
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
      volume: {
        type: "number",
        default: 0.5,
      },
      muted: {
        type: "boolean",
        default: false,
      },
    },

    on: {
      prevent: true,
      Space: "{{playPause()}}",
    },
  }

  async load(url) {
    this.ready = defer()
    this.media.src = url
    return this.ready
  }

  render() {
    let rafId

    const loop = () => {
      rafId = requestAnimationFrame(loop)
      this.elapsed = this.media.currentTime
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
            preload: "metadata",
            crossorigin: true,
            src: "{{path}}",
            autoplay: "{{autoplay}}",
            disabled: "{{duration === 0}}",
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
                // this.audio = false
              },
              "loadedmetadata": () => {
                this.elapsed = this.media.currentTime
                this.duration = this.media.duration
                // this.audio = this.media.videoHeight === 0
                this.media.volume = this.volume
                // console.log(this.media.getVideoPlaybackQuality())
                this.ready?.resolve()
              },
              "play || pause": () => {
                this.paused = this.media.paused
                if (this.paused) cancelAnimationFrame(rafId)
                else loop(0)
              },
              "volumechange": () => {
                this.muted = this.media.muted
                this.volume = this.media.muted ? 0 : this.media.volume
              },
            },
          },
        },
        {
          tag: "fieldset.items-center.unstyled.ui-player__controls",
          disabled: "{{duration === 0}}",
          content: [
            {
              tag: "button.ui-player__play",
              aria: { label: "{{paused ? 'play' : 'pause'}}" },
              picto: "{{paused ? 'play' : 'pause'}}",
              click: "{{playPause()}}",
            },
            {
              tag: "time.solid.ui-player__elapsed",
              aria: { label: "Current time" },
              datetime: "{{displayDatetime(elapsed)}}",
              content: "{{displayTime(elapsed, duration)}}",
            },
            {
              tag: "range.ui-player__seek",
              aria: { label: "Seek" },
              value: "{{elapsed}}",
              max: "{{duration}}",
              step: 0.01,
              on: {
                input: (e, { value }) => {
                  this.elapsed = value
                  if (!this.paused) cancelAnimationFrame(rafId)
                },
                change: (e, { value }) => {
                  this.media.currentTime = value
                  if (!this.paused) loop()
                },
              },
            },
            {
              tag: "time.solid.ui-player__duration",
              aria: { label: "Total time" },
              datetime: "{{displayDatetime(duration)}}",
              content: "{{displayTime(duration, duration)}}",
            },
            {
              tag: "button.ui-player__mute",
              aria: { label: "{{muted ? 'mute' : 'unmute'}}" },
              picto: "{{muted ? 'volume-off' : 'volume'}}",
              click: () => {
                this.media.muted = !this.media.muted
              },
            },
            {
              tag: "range.ui-player__volume",
              aria: { label: "Volume" },
              disabled: false,
              value: "{{volume}}",
              max: 1,
              step: 0.05,
              on: {
                input: (e, { value }) => {
                  this.media.muted = false
                  this.media.volume = value
                },
              },
            },
          ],
        },
      ],
    }
  }

  play() {
    if (this.duration === 0) return
    this.media.play()
  }

  pause() {
    this.media.pause()
  }

  playPause() {
    if (this.duration === 0) return
    if (this.media.paused) this.media.play()
    else this.media.pause()
  }

  toggleFullscreen() {
    toggleFullscreen(this.shell)
  }

  displayDatetime(duration) {
    return formatDuration(duration * 1000)
  }

  displayTime(time, duration) {
    return formatTime(time, duration < 3600)
  }
}

export default Component.define(Player)
