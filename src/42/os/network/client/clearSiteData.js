import system from "../../../system.js"

export async function clearSiteData(options) {
  if (system.network?.vhost) {
    const { origin } = new URL(system.network.vhost)
    const iframe = document.createElement("iframe")
    iframe.style = `display:none`
    document.documentElement.append(iframe)
    const clearVhost = async (url) => {
      await new Promise((resolve, reject) => {
        iframe.onload = resolve
        iframe.onerror = reject
        iframe.src = url
      })
      iframe.remove()
    }

    await Promise.all([
      clearVhost(`${origin}/?empty&clear-site-data`),
      fetch("/?empty&clear-site-data"),
    ])
  } else {
    await fetch("/?empty&clear-site-data")
  }

  if (options?.reload) location.reload()
}

export default clearSiteData
