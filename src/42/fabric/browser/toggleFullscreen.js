import ensureElement from "../dom/ensureElement.js"

export function toggleFullscreen(el = document.documentElement) {
  el = ensureElement(el)
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    el.requestFullscreen({
      navigationUI: "hide",
    }).catch((err) => {
      console.log(err)
    })
  }
}

export default toggleFullscreen
