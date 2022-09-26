import prompt from "../../ui/invocables/prompt.js"

export default async function renamePath(selection) {
  const name = await prompt("Rename", { value: selection })
  console.log("rename", name)
}
