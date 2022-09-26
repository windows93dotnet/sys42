// import open from "../cmd/open.cmd.js"
import apps from "../apps.js"

export default async function openFile(selection) {
  console.log(selection)
  return apps.open(selection)
}
