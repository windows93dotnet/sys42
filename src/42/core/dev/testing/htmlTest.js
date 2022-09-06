import system from "./mainSystem.js"

export function awaitTestFileReady(url, retry = 100) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      if (retry-- < 0) {
        clearInterval(interval)
        reject(new Error(`Testfile didn't load: ${url}`))
      }

      if (url in system.testing.testfiles) {
        clearInterval(interval)
        resolve()
      }
    }, 10)
  })
}

export default async function htmlTest(url, options) {
  const el = document.createElement("iframe")
  el.src = url
  el.style.cssText = `
position: absolute;
inset: 0;
width: 800px;
height: 600px;
opacity: 0.01;`

  if (options?.serializer?.keepIframes) el.style.opacity = 1

  document.body.append(el)

  try {
    await awaitTestFileReady(el.src, options?.retry)
    system.testing.iframes.push(el)
  } catch {
    el.remove()
  }

  return el
}
