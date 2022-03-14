/* eslint-disable unicorn/no-this-assignment */

//! Copyright (c) 2015 Felipe Ribeiro. MIT License.
// @src https://github.com/felipernb/algorithms.js

export default class LinkedListNode {
  constructor(value, next, prev) {
    this.value = value
    this.next = next
    this.prev = prev
  }

  indexOfNext(value) {
    let node = this
    let i = -1
    while (node) {
      i++
      if (node.value === value) return i
      node = node.next
    }

    return -1
  }

  indexOfPrev(value) {
    let node = this
    let i = -1
    while (node) {
      i++
      if (node.value === value) return i
      node = node.prev
    }

    return -1
  }

  findNext(value) {
    let node = this
    while (node) {
      if (node.value === value) return node
      node = node.next
    }
  }

  findPrev(value) {
    let node = this
    while (node) {
      if (node.value === value) return node
      node = node.prev
    }
  }

  hasNext(value) {
    return Boolean(this.findNext(value))
  }

  hasPrev(value) {
    return Boolean(this.findPrev(value))
  }

  has(value) {
    return Boolean(this.findNext(value) || this.findPrev(value))
  }
}
