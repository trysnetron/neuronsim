export default class StateStack {
  /**
   * Create new StateStack
   */
  constructor() {
    this.stack = []
  }

  /**
   * Add a new state (with params) to the stack
   * @param {String} label State label
   * @param {Object} options State parameters
   */
  push(label, options) {
    this.stack.push(Object.assign({label}, options))
  }

  /**
   * Remove top element in stack and return it
   */
  pop() {
    return this.stack.pop()
  }

  /**
   * Return the top element of the stack
   */
  top() {
    return this.stack[this.stack.length - 1]
  }

  /**
   * Remove all elements in the stack
   */
  flush() {
    this.stack = []
  }
}