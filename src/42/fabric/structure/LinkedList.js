//! Copyright (c) 2015 Felipe Ribeiro. MIT License.
// @src https://github.com/felipernb/algorithms.js
// @related https://github.com/Crizstian/data-structure-and-algorithms-with-ES6/tree/master/06-chapter-Linked-Lists-types
// @related https://github.com/felipernb/algorithms.js

import LinkedListNode from "./LinkedListNode.js"

// Doubly-linked list
export default class LinkedList {
  constructor() {
    this._length = 0
    this.head = undefined
    this.tail = undefined
  }

  get length() {
    return this._length
  }

  // Adds the element to the end of the list or to the desired index
  add(n, index) {
    if (index > this.length || index < 0) {
      throw new RangeError("Index out of bounds")
    }

    const node = new LinkedListNode(n)

    if (index !== undefined && index < this.length) {
      let prevNode
      let nextNode

      if (index === 0) {
        // Insert in the beginning
        nextNode = this.head
        this.head = node
      } else {
        nextNode = this.getNode(index)
        prevNode = nextNode.prev
        prevNode.next = node
        node.prev = prevNode
      }

      nextNode.prev = node
      node.next = nextNode
    } else {
      // Insert at the end
      if (!this.head) this.head = node

      if (this.tail) {
        this.tail.next = node
        node.prev = this.tail
      }

      this.tail = node
    }

    this._length++

    return node
  }

  // Return the value associated to the Node on the given index
  get(index) {
    return this.getNode(index).value
  }

  // O(n) get
  getNode(index) {
    if (index >= this.length || index < 0) {
      throw new RangeError("Index out of bounds")
    }

    let node = this.head
    for (let i = 1; i <= index; i++) {
      node = node.next
    }

    return node
  }

  delete(index) {
    if (index >= this.length || index < 0) {
      throw new RangeError("Index out of bounds")
    }

    this.delNode(this.getNode(index))
  }

  delNode(node) {
    if (node === this.tail) {
      this.tail = node.prev
    } else {
      node.next.prev = node.prev
    }

    if (node === this.head) {
      this.head = node.next
    } else {
      node.prev.next = node.next
    }

    this._length--
  }

  forEach(fn) {
    let node = this.head
    while (node) {
      fn(node.value, node)
      node = node.next
    }
  }

  has(value) {
    let node = this.head
    while (node) {
      if (node.value === value) return true
      node = node.next
    }

    return false
  }
}
