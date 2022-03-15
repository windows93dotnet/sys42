// @desc Serve resources with the proper media types (f.k.a. MIME types).
// @thanks https://github.com/h5bp/server-configs-apache/blob/master/dist/.htaccess
// @read https://www.iana.org/assignments/media-types/media-types.xhtml
// @read https://httpd.apache.org/docs/current/mod/mod_mime.html#addtype

/*
[1] https://mimesniff.spec.whatwg.org/#matching-a-font-type-pattern

[2] Serving `.ico` image files with a different media type
prevents Internet Explorer from displaying them as images:
https://github.com/h5bp/html5-boilerplate/commit/37b5fec090d00f38de64b591bcddcb205aadf8ee

[3] Servers should use text/javascript for JavaScript resources.
https://html.spec.whatwg.org/multipage/scripting.html#scriptingLanguages

[4] https://cbor.io/spec.html
*/

import freeze from "../type/object/freeze.js"

const PLAIN_TEXT_FILES = [
  "^about",
  "^authors",
  "^contributor",
  "^copying",
  "^license",
  "^readme",
  "^todo",
]

export const MIMETYPES = {
  // Data interchange
  application: {
    "atom+xml": "atom",
    "cbor": "cbor", // [4]
    "json": "json map topojson",
    "json5": "json5",
    "ld+json": "jsonld",
    "manifest+json": "webmanifest",
    "msgpack": "msp msgpack",
    "rss+xml": "rss",
    "vnd.geo+json": "geojson",
    "vnd.ms-fontobject": "eot", // [1]
    "webbundle": "wbn",
    "x-ndjson": "ndjson",
    "x-web-app-manifest+json": "webapp",
    "xml": "rdf xml",

    // Manifest files
    "octet-stream": "safariextz",
    "x-bb-appworld": "bbaw",
    "x-chrome-extension": "crx",
    "x-opera-extension": "oex",
    "x-xpinstall": "xpi",
  },

  // Web fonts
  font: {
    collection: "ttc",
    otf: "otf",
    ttf: "ttf",
    woff: "woff",
    woff2: "woff2",
  },

  // Media files
  audio: {
    flac: "flac",
    mp4: "f4a f4b m4a",
    mpeg: "mp3",
    ogg: "oga ogg opus",
  },
  video: {
    "mp4": "f4v f4p m4v mp4 mp4v mpg4",
    "ogg": "ogv",
    "webm": "webm",
    "x-flv": "flv",
  },
  image: {
    "bmp": "bmp",
    "gif": "gif",
    "jpeg": "jpeg jpg jpe",
    "png": "png",
    "svg+xml": "svg svgz",
    "webp": "webp",
    "x-icon": "cur ico", // [2]
  },
  text: {
    "cache-manifest": "manifest mf appcache",
    "calendar": "ics ifb",
    "css": "css",
    "csv": "csv",
    "html": "html htm xhtml",
    "javascript": "js mjs", // [3]
    "php": "php",
    "plain": "txt text conf log me faq " + PLAIN_TEXT_FILES.join(" "),
    "tab-separated-values": "tsv",
    "vcard": "vcard vcf",
    "vnd.rim.location.xloc": "xloc",
    "vtt": "vtt",
    "x-ansi": "ans",
    "x-component": "htc",
    "x-markdown": "md markdown mkd mdown",
    "x-nfo": "nfo",
    "xml": "xml xsl",
    "xslt+xml": "xslt",
  },
}

export const CHARSETS = {
  utf8: [
    "atom",
    "bbaw",
    "css",
    "geojson",
    "js",
    "json",
    "jsonld",
    "manifest",
    "rdf",
    "rss",
    "svg",
    "topojson",
    "vtt",
    "webapp",
    "webmanifest",
    "xloc",
    "xml",
  ],
}

export const EXTENSIONS = {
  charset: {},
  mimetype: {},
}

export const NAMES = {
  charset: {},
  mimetype: {},
}

CHARSETS.utf8.forEach((ext) => {
  EXTENSIONS.charset[`.${ext}`] = "utf8"
})

Object.entries(MIMETYPES).forEach(([main, item]) => {
  Object.entries(item).forEach(([sub, val]) => {
    val.split(" ").forEach((ext) => {
      if (ext.charAt(0) === "^") {
        ext = ext.slice(1)
        NAMES.mimetype[ext] = `${main}/${sub}`
        if (main === "text") NAMES.charset[ext] = "utf8"
      } else {
        EXTENSIONS.mimetype[ext] = `${main}/${sub}`
        if (main === "text") EXTENSIONS.charset[ext] = "utf8"
      }
    })
  })
})

export default freeze({
  CHARSETS,
  NAMES,
  EXTENSIONS,
})
