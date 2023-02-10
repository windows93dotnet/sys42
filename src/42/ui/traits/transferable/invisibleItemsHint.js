import ItemsHint from "./ItemsHint.js"

export class InvisibleItemsHint extends ItemsHint {}

export function invisibleItemsHint(options) {
  return new InvisibleItemsHint(options)
}

export default invisibleItemsHint
