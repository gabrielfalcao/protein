import * as React from 'react'
import ReactDOM from 'react-dom'
import {
  getQueriesForElement,
  prettyDOM,
  configure as configureDTL
} from '@testing-library/dom'
import { fireEvent, act } from '@testing-library/react'
import { create, act as actMounted } from 'react-test-renderer'
import { Simulate } from 'react-dom/test-utils' // ES6

import {
  getInstanceFromNode,
  getNodeFromInstance,
  getFiberCurrentPropsFromNode
} from 'protein/react-dom/internals'

const renderedContainers = new Set()
const mountedContainers = new Set()

function isComponent(thing) {
  return React.isValidElement(thing)
}

//https://agent-hunt.medium.com/hello-world-custom-react-renderer-9a95b7cd04bc
// https://www.velotio.com/engineering-blog/react-fiber-algorithm
// -> https://github.com/koba04/react-fiber-resources
//    -> https://engineering.hexacta.com/didact-fiber-incremental-reconciliation-b2fe028dcaec
//       -> https://pomb.us/build-your-own-react/
class FakeNode {
  constructor(element) {
    const { type, props } = element || {}
    const { children } = props || {}
    this.type = type
    this.children = children
    this.props = props
    this.element = element
  }
}
class BaseWrapper {
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
class TestRendererWrapper extends BaseWrapper {
  updateComponentLifeCycle(props, state) {
    actMounted(() => this.__instance__.updater.enqueueSetState(newState))
    return this.__instance__.state || {}
  }
  setInstance(instance) {
    const { _fiber } = instance || {}
    const { stateNode } = _fiber || {}

    this.__instance__ = stateNode || instance
    //console.warn('TestRendererWrapper.setInstance', { instance: this.__instance__ });
  }

  setState(state = undefined) {
    const newState = state || this.__element__.state
    this.updateComponentLifeCycle(this.__element__.props, newState)
  }
  state(computed = false) {
    return computed ? this.computeNewState() : this.__instance__.state
  }
  simulate(eventName, eventData) {
    actMounted(() => Simulate[eventName](this.__parent__, eventData))
  }
}

class TestingLibraryWrapper extends BaseWrapper {
  initialize({ container, baseElement, queries }) {
    this.container = container
    this.baseElement = baseElement
    Object.entries(getQueriesForElement(baseElement, queries)).forEach(
      ([key, value]) => {
        this[key] = value
      }
    )
  }
  setState(state = undefined) {
    const newState = state || this.__element__.state
    //this.__instance__.setState(newState);
    this.updateComponentLifeCycle(this.__element__.props, newState)
  }

  updateComponentLifeCycle(props, state) {
    const newState = this.computeNewState(props, state)
    const instance = this.__instance__
    ReactDOM.flushSync(() => {
      instance.setState(newState)
    })
    return newState
  }
  props() {
    return this.__element__.props
  }
  state() {
    return this.computeNewState()
  }
  debug(el, maxLength, options) {
    const element = el || this.baseElement
    Array.isArray(element)
      ? // eslint-disable-next-line no-console
      element.forEach((e) => console.log(prettyDOM(e, maxLength, options)))
      : // eslint-disable-next-line no-console,
      console.log(prettyDOM(element, maxLength, options))
  }
  async unmount() {
    if (this.isMounted()) {
      await act(() => {
        ReactDOM.unmountComponentAtNode(this.container)
        this.isMounted = false
      })
    }
  }
  rerender(props = {}) {
    const { container, baseElement, contextWrapper, contextWrapperProps } = this
    return render(
      this.__element__,
      {
        container,
        baseElement,
        contextWrapper,
        contextWrapperProps,
        props: { ...this.__element__.props, ...props }
      },
      this
    )
  }
  asFragment() {
    /* istanbul ignore else (old jsdom limitation) */
    if (typeof document.createRange === 'function') {
      return document
        .createRange()
        .createContextualFragment(container.innerHTML)
    } else {
      const template = document.createElement('template')
      template.innerHTML = container.innerHTML
      return template.content
    }
  }
}

function mount(
  ui,
  {
    props = {},
    contextWrapper = undefined,
    contextWrapperProps = undefined
  } = {},
  wrapper = undefined
) {
  if (!ui) {
    throw new Error(`invalid component: ${ui}`)
  }

  let __wrapper__

  __wrapper__ = wrapper
    ? wrapper
    : new TestRendererWrapper({
      props,
      contextWrapper,
      contextWrapperProps
    })

  const newProps = { ...ui.props, ...props }
  const element = React.createElement(ui.type, newProps, ui.children)
  const parent = create(
    contextWrapper ? contextWrapper(element, contextWrapperProps) : element,
    {
      createNodeMock: (element) => new Node(element)
    }
  )
  actMounted(() => {
    __wrapper__.setElement(element)
    __wrapper__.setParent(parent)
    __wrapper__.setInstance(parent.getInstance())
    __wrapper__.setProps(newProps)
  })
  return __wrapper__
}

function render(
  ui,
  {
    container,
    baseElement = container,
    queries,
    hydrate = false,
    props = {},
    contextWrapper = undefined,
    contextWrapperProps = undefined
  } = {},
  wrapper = undefined
) {
  if (!ui) {
    throw new Error(`invalid component: ${ui}`)
  }

  const renderDOM = hydrate ? ReactDOM.hydrate : ReactDOM.render
  let __wrapper__
  if (!baseElement) {
    // default to document.body instead of documentElement to avoid output of potentially-large
    // head elements (such as JSS style blocks) in debug output
    baseElement = document.body
  }
  if (!container) {
    container = baseElement.appendChild(document.createElement('div'))
  }

  // we'll add it to the mounted containers regardless of whether it's actually
  // added to document.body so the cleanup method works regardless of whether
  // they're passing us a custom container or not.
  renderedContainers.add(container)

  __wrapper__ = wrapper
    ? wrapper
    : new TestingLibraryWrapper({
      container,
      queries,
      props,
      baseElement,
      contextWrapper,
      contextWrapperProps
    })

  act(() => {
    const newProps = { ...ui.props, ...props }
    const element = React.createElement(ui.type, newProps, ui.children)
    const parent = contextWrapper
      ? contextWrapper(element, contextWrapperProps)
      : element
    const rendered = renderDOM(parent, container)
    const instance = getInstanceFromNode(rendered)
    __wrapper__.setElement(element)
    __wrapper__.setParent(parent)
    __wrapper__.setInstance(instance)
    __wrapper__.setProps(newProps)
  })
  return __wrapper__
}

function cleanup() {
  renderedContainers.forEach(cleanupAtContainer)
}

// maybe one day we'll expose this (perhaps even as a utility returned by render).
// but let's wait until someone asks for it.
function cleanupAtContainer(container) {
  act(() => {
    ReactDOM.unmountComponentAtNode(container)
  })
  if (container.parentNode === document.body) {
    document.body.removeChild(container)
  }
  renderedContainers.delete(container)
}

export * from '@testing-library/dom'
export { render, cleanup, act, mount, actMounted }

/* eslint func-name-matching:0 */
