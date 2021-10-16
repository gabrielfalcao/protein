export class BaseWrapper {
  constructor({ props, contextWrapper, contextWrapperProps, ...options }) {
    this.__props__ = props || {}
    this.contextWrapperProps = contextWrapperProps
    this.contextWrapper = contextWrapper
    // https://reactjs.org/blog/2015/12/18/react-components-elements-and-instances.html
    this.__element__ = null
    this.__parent__ = null
    this.__instance__ = null
    this.initialize(options)
  }
  initialize() {
    //
  }
  isMounted() {
    return Boolean(this.__element__)
  }
  setInstance(instance) {
    //console.warn('BaseWrapper.setInstance', { instance });
    this.__instance__ = instance
    console.warn('setInstance', { instance })
  }
  setElement(element) {
    this.__element__ = element
    this.__props__ = { ...this.props, ...element.props }
  }
  setParent(parent) {
    this.__parent__ = parent
  }
  setProps(props) {
    this.__props__ = { ...this.props, ...(props || {}) }
  }
  props() {
    return this.__props__
  }
  state() {
    return {}
  }
  computeNewState(props, state) {
    // https://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/
    const newProps = props || this.__element__.props
    const newState = state || this.__instance__?.state || {}

    const computedState = this.__element__.type.getDerivedStateFromProps(
      newProps,
      newState
    )
    return computedState || newState
  }
  setState(state = undefined) {
    throw new Error('not implemented')
  }
  updateComponentLifeCycle(props, state) {
    throw new Error('not implemented')
  }
}

export default BaseWrapper
