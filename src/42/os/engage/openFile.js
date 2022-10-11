import appsManager from "../appsManager.js"

export default async function openFile(selection) {
  return appsManager.open(selection)
}
