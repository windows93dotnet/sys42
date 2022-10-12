import appsManager from "../managers/appsManager.js"

export default async function openFile(selection) {
  return appsManager.open(selection)
}
