export default function getParentMethod(el, method) {
  while (el?.nodeType === Node.ELEMENT_NODE) {
    if (typeof el[method] === "function") {
      // TODO: check XSS pretection using "append"
      return (...args) => el[method](...args)
    }

    el = el.parentNode
  }
}
