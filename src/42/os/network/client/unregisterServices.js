export async function unregisterServices() {
  return navigator.serviceWorker.getRegistrations().then(async (regs) => {
    const res = await Promise.all(regs.map((reg) => reg.unregister()))
    if (res.length > 0 && res.every(Boolean)) {
      return true
    }
  })
}

export default unregisterServices
