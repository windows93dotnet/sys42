import glob from "../../../src/42/core/path/glob.js"

export default function lookupTestfiles(
  graphResult,
  url,
  testFiles = [],
  visited = new Set()
) {
  visited.add(url)
  if (url.endsWith(".test.js")) return [url.slice(1)]
  if (url.endsWith("/42/test.js")) return testFiles
  if (url in graphResult.files) {
    const files = new Set(graphResult.files[url])

    for (const [pattern, deps] of graphResult.globs) {
      if (glob.test(url, pattern)) deps.forEach((x) => files.add(x))
    }

    for (const file of files) {
      if (visited.has(file)) continue
      visited.add(file)
      if (file.endsWith(".test.js")) testFiles.push(file.slice(1))
      lookupTestfiles(graphResult, file, testFiles, visited)
    }
  }

  return testFiles
}
