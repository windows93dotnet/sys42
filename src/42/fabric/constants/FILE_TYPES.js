/* eslint-disable max-depth */
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

export const extnames = {}
export const basenames = {}
export const mimetypes = {
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
    "wasm": "wasm",
    "x-ndjson": "ndjson",
    "x-web-app-manifest+json": "webapp",
    "xml": "rdf xml",
    "xslt+xml": "xslt",

    // Manifest files
    "octet-stream": "safariextz",
    "x-bb-appworld": "bbaw",
    "x-chrome-extension": "crx",
    "x-opera-extension": "oex",
    "x-xpinstall": "xpi",

    // Archives
    "gzip": "tgz gz",
    "x-rar": "rar",
    "x-tar": "tar",
    "zip": "zip",
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
    "aac": "aac",
    "flac": "flac",
    "mp4": "f4a f4b m4a",
    "mpeg": "mp3",
    "ogg": "oga ogg opus",
    "x-wav": "wav",
  },
  video: {
    "3gpp": "3gp",
    "mp4": "f4v f4p m4v mp4 mp4v mpg4",
    "ogg": "ogv",
    "quicktime": "mov",
    "webm": "webm",
    "x-flv": "flv",
    "x-matroska": "mkv",
    "x-ms-wmv": "wmv",
    "x-msvideo": "avi",
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
    "plain": "txt text conf log me faq",
    "tab-separated-values": "tsv",
    "vcard": "vcard vcf",
    "vnd.rim.location.xloc": "xloc",
    "vtt": "vtt",
    "x-ansi": "ans",
    "x-component": "htc",
    "x-markdown": "md markdown mkd mdown",
    "x-nfo": "nfo",
  },
}

const UTF8 = {
  application: [
    "atom+xml",
    "json",
    "ld+json",
    "manifest+json",
    "rss+xml",
    "vnd.geo+json",
    "vnd.rim.location.xloc",
    "x-bb-appworld",
    "x-web-app-manifest+json",
    "xml",
  ],
  image: [
    "svg+xml", //
  ],
  text: [
    "cache-manifest",
    "calendar",
    "css",
    "html",
    "javascript",
    "markdown",
    "plain",
    "vcard",
    "vnd.wap.wml",
    "vtt",
    "x-component",
    "xml",
  ],
}

for (const type in mimetypes) {
  if (Object.hasOwn(mimetypes, type)) {
    for (const subtype in mimetypes[type]) {
      if (Object.hasOwn(mimetypes[type], subtype)) {
        const infos = {
          mimetype: `${type}/${subtype}`,
          extnames: mimetypes[type][subtype].split(" ").map((x) => `.${x}`),
        }

        if (UTF8[type]?.includes(subtype)) infos.charset = "utf-8"
        mimetypes[type][subtype] = infos
        for (const ext of infos.extnames) extnames[ext] = infos
      }
    }
  }
}

const a = [
  "manifest.json", //
]

mimetypes.application["manifest+json"].basenames = a

for (const filename of a) {
  basenames[filename] = mimetypes.application["manifest+json"]
}

const b = [
  "about",
  "authors",
  "contributor",
  "copying",
  "license",
  "readme",
  "todo",
]

mimetypes.text.plain.basenames = b

for (const filename of b) {
  basenames[filename] = mimetypes.text.plain
}

export default { mimetypes, extnames, basenames }
