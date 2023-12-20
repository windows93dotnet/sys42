export async function untilDocumentReady() {
  if (document.readyState === "complete") return

  return new Promise((resolve) => {
    const handler = () => {
      if (document.readyState === "complete") {
        document.removeEventListener("readystatechange", handler)
        resolve()
      }
    }

    document.addEventListener("readystatechange", handler)
  })
}

export default untilDocumentReady
