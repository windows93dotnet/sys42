import rpc from "../../core/ipc/rpc.js"

const openInNewTab = rpc(function openInNewTab(url) {
  const a = document.createElement("a")
  a.href = url
  a.target = "_blank"
  a.click()
})

export default openInNewTab
