// @see https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Recommended_drag_types
// @see https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Multiple_items

import arrify from "../any/arrify.js"

const hidden = [
  Object.assign(new Image(), {
    src: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==", // [1]
  }),
  1000 * 1000, // [2]
  1000 * 1000,
]

// [1] transparent gif https://stackoverflow.com/a/13139830
// [2] Make the image far away from the cursor because Firefox/Linux don't always support transparency

export default async function dataTransfertExport(dataTransfer, options) {
  dataTransfer.setDragImage(
    ...(options?.dragImage ? arrify(options?.dragImage) : hidden)
  )
  dataTransfer.effectAllowed = options?.effect ?? "all"

  if (options?.paths) {
    const { paths } = options
    const urls = paths.map((path) => new URL(path, location.origin).href)
    const data = JSON.stringify({ DT_PATHS_42: navigator.userAgent, paths })
    dataTransfer.setData("text/x-moz-url", urls.join("\n"))
    dataTransfer.setData("text/uri-list", urls.join("\r\n"))
    dataTransfer.setData("text/plain", data)
  }
}
