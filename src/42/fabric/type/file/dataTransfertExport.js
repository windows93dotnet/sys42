// @see https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Recommended_drag_types
// @see https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Multiple_items

const hidden = [
  Object.assign(new Image(), {
    src: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
  }),
  1000 * 1000,
  1000 * 1000,
]

export default async function dataTransfertExport(dataTransfer, options) {
  dataTransfer.setDragImage(...(options?.dragImage ?? hidden))
  dataTransfer.effectAllowed = options?.effect ?? "all"

  if (options?.paths) {
    const { paths } = options
    const urls = paths.map((path) => new URL(path, location.origin).href)
    const data = JSON.stringify({ "42_DT_PATHS": navigator.userAgent, paths })
    dataTransfer.setData("text/x-moz-url", urls.join("\n"))
    dataTransfer.setData("text/uri-list", urls.join("\r\n"))
    dataTransfer.setData("text/plain", data)
  }
}
