import "./form.js"
import "../os/managers/themesManager.js"
// import "./components/tooltip.js"

document.documentElement.lang ||= "en"

if (window.top !== window.self) {
  document.body.classList.add("in-iframe")

  window.addEventListener("blur", () => {
    import("../core/ipc.js").then(({ ipc }) => {
      ipc.emit("42_IFRAME_BLUR")
    })
  })
}

const prevent = (e) => e.preventDefault()
window.addEventListener("dragover", prevent)
window.addEventListener("drop", prevent)
