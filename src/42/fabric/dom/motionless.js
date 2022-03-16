import debounce from "../type/function/debounce.js"

export default function motionless(el) {
  const saved = el.style.transitionDuration
  const cancel = () => {
    el.style.transitionDuration = "0s"
  }

  const restore = debounce(() => {
    el.style.transitionDuration = saved
  })

  return {
    cancel,
    restore,
  }
}
