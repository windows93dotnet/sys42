const { pathname } = new URL(
  "../../../os/network/client/vhost.html",
  import.meta.url,
)

export const inVhost =
  globalThis.document?.referrer.includes("vhost.html") &&
  new URL(document.referrer).pathname === pathname

export default inVhost
