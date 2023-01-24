import arrify from "../../fabric/type/any/arrify.js"
import prompt from "../../ui/invocables/prompt.js"

export default async function renamePath(selection) {
  selection = arrify(selection)
  const res = await prompt("Rename (not ready...)", {
    value: selection.join("\n"),
  })
  console.log("rename", res)
}
