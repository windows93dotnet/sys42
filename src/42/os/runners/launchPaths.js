import explorer from "../../ui/components/explorer.js"
import arrify from "../../fabric/type/any/arrify.js"
import appsManager from "../managers/appsManager.js"

export default function launchPaths(selection) {
  const files = []
  for (const path of arrify(selection)) {
    if (path.endsWith("/")) explorer(path)
    else files.push(path)
  }

  appsManager.open(files)
}
