const TYPES = {
  number: "number",
  integer: "number",
  boolean: "checkbox",
}

const FORMATS = {
  "date-time": "datetime-local",
  "date": "date",
  "duration": "time",
  "email": "email",
  "time": "time",
  // "uri": "url",
  "url": "url",
}

const walk = (schema, name, schemaRef) => {
  const out = Object.create(null)

  if (name != null) out.name = name
  if (schemaRef) out.schema = schemaRef
  if ("title" in schema) out.label = schema.title

  if (schema.type === "string") {
    out.type = FORMATS[schema.format] ?? "input"
  } else if (schema.type in TYPES) {
    out.type = TYPES[schema.type]
  } else if (schema.type === "object" && "properties" in schema) {
    out.type = "fieldset"
    out.content = []
    for (let [key, val] of Object.entries(schema.properties)) {
      key = key.replaceAll(".", "\\.")
      const newName = (name && name !== "." ? name + "." : "") + key
      out.content.push(walk(val, newName, `${schemaRef}.properties.${key}`))
    }
  } else if (schema.type === "array") {
    out.type = "fieldset"

    if (schema.items) {
      const list = {
        type: "ui-repeater",
        class: "colspan panel",
        name: out.name,
        repeat: walk(schema.items, ".", `${schemaRef}.items`),
      }
      out.content = list
    }

    // TODO: support prefixItems https://json-schema.org/understanding-json-schema/reference/array.html#id7
  }

  if ("enum" in schema) out.type = "select"

  if ("ui" in schema) Object.assign(out, schema.ui)

  return out
}

export default function schemaToContent(schema, name = "") {
  return walk(schema, name, "")
}
