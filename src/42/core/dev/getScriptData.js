export default function getScriptData(url) {
  const { pathname } = new URL(url, document.URL)
  const selector = `script[src$="${pathname}"]`
  const script = document.querySelector(selector)

  if (!script) return

  const data = {}

  for (const [key, val] of Object.entries(script.dataset)) {
    try {
      data[key] = JSON.parse(val)
    } catch {
      data[key] = val
    }
  }

  return data
}
