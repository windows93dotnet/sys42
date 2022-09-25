import system from "./mainSystem.js"
import inIframe from "../../env/realm/inIframe.js"
import getParentModule from "../../../fabric/getParentModule.js"
import shortenFilename from "../../../core/path/shortenFilename.js"
import Suite from "./class/Suite.js"

const TITLE_REGEX =
  /^\.?\/?(_{0,2}tests?_{0,2})\/?|(\.(test|spec))?\.(c|m)?js$/gi

let lastTitled
export default function ensureCurrentSuite(titled) {
  const parentModule = inIframe
    ? { url: location.href, stack: [{ filename: location.href }] }
    : getParentModule(/\.test\.(js|html)/)

  let exist

  const moduleTitle = shortenFilename(parentModule.url)
    .replace(TITLE_REGEX, "")
    .replace(/^\//, "")
    .replace(/\?.*$/, "")
    .replace(/\.(test|demo)\.html/, " (html)")

  if (titled) lastTitled = titled
  else if (
    lastTitled &&
    system.testing.suites.has(`${moduleTitle}/${lastTitled}`)
  ) {
    titled = lastTitled
  }

  const title = titled ? `${moduleTitle}/${titled}` : moduleTitle

  if (!system.testing.suites.has(title)) exist = false

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
