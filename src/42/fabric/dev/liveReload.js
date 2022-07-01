/* eslint-disable max-params */

import env from "../../system/env.js"
import parseCSSUrl from "../cssom/parseCSSUrl.js"
import walkCSSRules from "../cssom/walkCSSRules.js"
import log from "../../system/log.js"
import preload from "../../system/load/preload.js"
import inOpaqueOrigin from "../../system/env/runtime/inOpaqueOrigin.js"

import when from "../type/promise/when.js"
import sleep from "../type/promise/sleep.js"

const task = {
  log: log
    .level(2)
    .yellow /* .hour */
    .prefix("┃ ♻️"),
}

const { FONT_FACE_RULE, IMPORT_RULE, STYLE_RULE } = CSSRule

function findTopImport(href, url, rule) {
  if (rule.parentStyleSheet.ownerNode) {
    if (rule.parentStyleSheet.ownerNode.tagName === "LINK") {
      updateElement(
        rule.parentStyleSheet.ownerNode,
        new URL(rule.parentStyleSheet.ownerNode.href),
        "href"
      )
    } else {
      const el = rule.parentStyleSheet.ownerNode
      const clone = el.cloneNode(true)
      el.after(clone)
      el.remove()
    }
  } else if (rule.parentStyleSheet.ownerRule?.type === IMPORT_RULE) {
    findTopImport(href, url, rule.parentStyleSheet.ownerRule)
  }
}

async function updateRule(rule, sheet, relativeURL, url, i) {
  url.searchParams.set("t", Date.now())
  const changed = rule.cssText.replaceAll(relativeURL, url.href)

  const as =
    rule.type === FONT_FACE_RULE
      ? "font"
      : rule.type === IMPORT_RULE || rule.type === STYLE_RULE
      ? "style"
      : "image"

  await preload(url, { as })
  sheet.insertRule(changed, i + 1)
  sheet.deleteRule(i)
}

async function updateElement(el, url, key) {
  url.searchParams.set("t", Date.now())
  const clone = el.cloneNode(true)
  const { display } = clone.style
  clone.style.display = "none"
  clone[key] = url.href
  el.after(clone)
  await Promise.race([
    sleep(500),
    when(clone, "load error readystatechange", { race: true }),
  ])
  el.remove()
  clone.style.display = display
}

export default function liveReload(path) {
  if (path === liveReload.entry || path === "reload" || path.endsWith("js")) {
    task.log(`⚡ hard reload ${log.format.file(path)}`)
    location.reload(true)
  } else {
    document
      .querySelectorAll(
        `link[href]:not([href=""]),
        iframe[src]:not([src=""]),
        object[data]:not([data=""])`
      )
      .forEach((el) => {
        const key = el.src ? "src" : el.href ? "href" : "data"
        let url = el[key]
        url = url ? new URL(url, location.href) : undefined
        if (url?.pathname === path || inOpaqueOrigin) {
          task.log(` reload ${log.format.file(path)}`)
          updateElement(el, url, key)
        }
      })

    if (inOpaqueOrigin) return

    walkCSSRules((rule, i, sheet) => {
      const urls = rule.href ? [rule.href] : parseCSSUrl(rule.cssText)
      for (const relativeURL of urls) {
        const url = new URL(relativeURL, sheet.href ?? location.origin)
        if (url.pathname === path) {
          task.log(` reload ${log.format.file(path)}`)
          if (env.browser.isChrome) {
            findTopImport(url, url, rule)
          } else {
            updateRule(rule, sheet, relativeURL, url, i)
          }
        }
      }
    })
  }
}

liveReload.entry = new URL(document.URL).pathname
if (liveReload.entry.endsWith("/")) liveReload.entry += "index.html"
