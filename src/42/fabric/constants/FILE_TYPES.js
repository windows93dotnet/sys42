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

const UTF8 = new Set([
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
])

const data = {
  mimetypes: {
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
      "xslt+xml": "xslt",

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
  },

  filenames: Object.fromEntries(
    [
      "about",
      "authors",
      "contributor",
      "copying",
      "license",
      "readme",
      "todo",
    ].map((name) => [name, { mimetype: "text/plain", charset: "utf-8" }])
  ),

  extentions: {},
}

for (const type in data.mimetypes) {
  if (Object.hasOwn(data.mimetypes, type)) {
    for (const subtype in data.mimetypes[type]) {
      if (Object.hasOwn(data.mimetypes[type], subtype)) {
        data.mimetypes[type][subtype] = data.mimetypes[type][subtype]
          .split(" ")
          .map((ext) => {
            const obj = { mimetype: `${type}/${subtype}` }
            if (type === "text" || UTF8.has(ext)) obj.charset = "utf-8"
            const x = `.${ext}`
            data.extentions[x] = obj
            return x
          })
      }
    }
  }
}

export default data
