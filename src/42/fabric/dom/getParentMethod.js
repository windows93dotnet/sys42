export default function getParentMethod(el, method) {
  while (el?.nodeType === Node.ELEMENT_NODE) {
    if (
      typeof el[method] === "function" &&
      method in Element.prototype === false
    ) {
      return (...args) => el[method](...args)
    }

    el = el.parentNode
  }
}
