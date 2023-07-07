// @src https://twitter.com/LeaVerou/status/934590045708840960

export default function deburr(str) {
  return str.normalize("NFD").replaceAll(/[\u0300-\u036f]/g, "")
}
