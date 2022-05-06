export default function getInheritedMethod(el, method) {
  while (el) {
    if (
      el.nodeType === Node.ELEMENT_NODE &&
      typeof el[method] === "function" &&
      method in Element.prototype === false
    ) {
      return (...args) => el[method](...args)
    }

    el = el.parentNode
  }
}
