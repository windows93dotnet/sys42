// TODO: write better parser
export default function parseCSSUrl(str) {
  const urls = []
  str.replace(/\burl\s*\(([^)]*)\)/g, (_, url) => {
    const last = url.length - 1
    if (
      (url[0] === '"' && url[last] === '"') ||
      (url[0] === "'" && url[last] === "'")
    ) {
      url = url.slice(1, -1)
    }

    urls.push(url)
  })
  return urls
}
