import prompt from "../../ui/invocables/prompt.js"

export default async function renameFile(path) {
  const name = await prompt("Rename", { value: path })
  console.log("rename", name)
}
