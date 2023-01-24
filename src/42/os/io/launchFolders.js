import explorer from "../../ui/components/explorer.js"
import arrify from "../../fabric/type/any/arrify.js"

export default function launchFolder(selection) {
  for (const path of arrify(selection)) {
    explorer(path)
  }
}
