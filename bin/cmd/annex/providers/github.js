import loadJSON from "../../../../src/42/core/load/loadJSON.js"

const { GH_CLIENT_ID, GH_ACCESS_TOKEN } = process.env

const token =
  GH_CLIENT_ID && GH_ACCESS_TOKEN
    ? `&client_id=${GH_CLIENT_ID}&access_token=${GH_ACCESS_TOKEN}`
    : ""

export async function github(item) {
  const url = `https://api.github.com/repos/${item.id}/git/trees/${item.version}?recursive=1${token}`
  const res = await loadJSON(url)
  item.tree = res.tree.filter((x) => x.type === "blob").map((x) => x.path)
  return item
}

export default github
