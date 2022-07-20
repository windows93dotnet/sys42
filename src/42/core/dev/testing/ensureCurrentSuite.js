import system from "../../../system.js"
import getParentModule from "../../../fabric/getParentModule.js"
import shortenFilename from "../../../fabric/type/path/shortenFilename.js"
import Suite from "./class/Suite.js"

const TITLE_REGEX =
  /^\.?\/?(_{0,2}tests?_{0,2})\/?|(\.(test|spec))?\.(c|m)?js$/gi

let lastTitled
export default function ensureCurrentSuite(titled) {
  const parentModule = getParentModule(/\.test\.(js|html)/)
  let exist

  const moduleTitle = shortenFilename(parentModule.url)
    .replace(TITLE_REGEX, "")
    .replace(/\?.*$/, "")
    .replace(/\.test\.html/, " (html)")

  if (titled) lastTitled = titled
  else if (
    lastTitled &&
    system.testing.suites.has(`${moduleTitle}/${lastTitled}`)
  ) {
    titled = lastTitled
  }

  const title = titled ? `${moduleTitle}/${titled}` : moduleTitle

  if (!system.testing.suites.has(title)) exist = false

  if (titled === undefined && title === "42/fs" && exist === false) {
    console.log(new Error("ok"))
  }

  if (exist === false) {
    system.testing.current = system.testing.root
    const suite = new Suite(title, parentModule.url)
    system.testing.current.suites.push(suite)
    system.testing.current = suite
    system.testing.suites.set(title, suite)
  } else {
    system.testing.current = system.testing.suites.get(title)
  }

  return parentModule.stack
}
