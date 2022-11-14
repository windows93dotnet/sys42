//! Copyright (c) 2014-2018 Sophia Antipenko. MIT License.
// @src https://github.com/website-scraper/node-css-url-parser/blob/master/lib/css-parser.js

const embeddedRegexp = /^data:(.*?),(.*?)/
const commentRegexp = /\/\*([\S\s]*?)\*\//g
const urlsRegexp =
  /(?:@import\s+)?url\s*\(\s*(("(.*?)")|('(.*?)')|(.*?))\s*\)|@import\s+(("(.*?)")|('(.*?)')|(.*?))[\s;]/gi

function isEmbedded(src) {
  return embeddedRegexp.test(src.trim())
}

export default function parseCSSUrl(text) {
  const urls = []
  let urlMatch
  let url

  text = text.replace(commentRegexp, "")

  while ((urlMatch = urlsRegexp.exec(text))) {
    // Match 3, 5, 6 group if '[@import] url(path)', match 9, 11, 12 group if '@import path'
    url =
      urlMatch[3] ||
      urlMatch[5] ||
      urlMatch[6] ||
      urlMatch[9] ||
      urlMatch[11] ||
      urlMatch[12]

    if (url && !isEmbedded(url) && !urls.includes(url)) {
      urls.push(url)
    }
  }

  return urls
}
