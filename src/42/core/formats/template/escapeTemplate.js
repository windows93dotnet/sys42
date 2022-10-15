export default function escapeTemplate(source) {
  return source.replaceAll("{{", "\\{{")
}
