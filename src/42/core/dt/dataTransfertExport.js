// @see https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Recommended_drag_types
// @see https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Multiple_items

import arrify from "../../fabric/type/any/arrify.js"
import { fromOptions } from "./dataTransferEffects.js"

const { userAgent } = navigator

const hidden = [
  Object.assign(new Image(), {
    src: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==", // [1]
  }),
  1000 * 1000, // [2]
  1000 * 1000,
]

// [1] transparent gif https://stackoverflow.com/a/13139830
// [2] Make the image far away from the cursor because Firefox/Linux don't always support transparency

export default async function dataTransfertExport(e, options) {
  const { dataTransfer } = e

  if (options?.image !== true) {
    dataTransfer.setDragImage(
      ...(options?.image ? arrify(options?.image) : hidden)
    )
  }

  dataTransfer.effectAllowed = fromOptions(options?.effects)

  if (options?.paths) {
    const { paths } = options
    const urls = paths.map((path) => new URL(path, location.origin).href)
    dataTransfer.setData("text/x-moz-url", urls.join("\n"))
    dataTransfer.setData("text/uri-list", urls.join("\r\n"))

    const data = JSON.stringify({ userAgent, paths })
    dataTransfer.setData("application/42-paths+json", data)
  }

  if (options?.data) {
    dataTransfer.setData("application/json", JSON.stringify(options.data))
  }
}
