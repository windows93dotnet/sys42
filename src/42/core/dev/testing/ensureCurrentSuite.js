import system from "./mainSystem.js"
import inIframe from "../../env/realm/inIframe.js"
import getParentModule from "../../../fabric/getParentModule.js"
import shortenFilename from "../../../core/path/shortenFilename.js"
import Suite from "./classes/Suite.js"

const TITLE_REGEX =
  /^\.?\/?(_{0,2}tests?_{0,2})\/?|(\.(test|spec))?\.(c|m)?js$/gi

let originalScript
if (inIframe) {
  for (const { src } of document.querySelectorAll("script")) {
    if (src.endsWith(".test.js")) {
      originalScript = src
    }
  }
}

export default function ensureCurrentSuite(titled) {
  const parentModule = inIframe
    ? originalScript
      ? { url: originalScript, stack: [{ filename: originalScript }] }
      : { url: location.href, stack: [{ filename: location.href }] }
    : getParentModule(/\.test\.(js|html)/)

  let exist

  const moduleTitle = shortenFilename(parentModule.url)
    .replace(TITLE_REGEX, "")
    .replace(/^\//, "")
    .replace(/\?.*$/, "")
    .replace(/\.(test|demo)\.html/, " (html)")

  if (titled) system.testing.lastTitled = titled
  else if (
    system.testing.lastTitled &&
    system.testing.suites.has(`${moduleTitle}/${system.testing.lastTitled}`)
  ) {
    titled = system.testing.lastTitled
  }

  const title = titled ? `${moduleTitle}/${titled}` : moduleTitle

  if (!system.testing.suites.has(title)) exist = false

  if (exist === false) {
    system.testing.current = system.testing.root
    const suite = new Suite(title, parentModule.url, system.testing.root.stats)
    system.testing.current.suites.push(suite)
    system.testing.current = suite
    system.testing.suites.set(title, suite)
  } else {
    system.testing.current = system.testing.suites.get(title)
  }

  return parentModule.stack
}
