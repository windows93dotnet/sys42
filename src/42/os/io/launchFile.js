import appsManager from "../managers/appsManager.js"

export default async function launchFile(selection) {
  return appsManager.open(selection)
}
