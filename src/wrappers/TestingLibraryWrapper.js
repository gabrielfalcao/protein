import * as React from 'react'
import ReactDOM from 'react-dom'
import {
  getQueriesForElement,
  prettyDOM,
  configure as configureDTL
} from '@testing-library/dom'
import { act } from '@testing-library/react'

import {
  getInstanceFromNode,
  getNodeFromInstance,
  getFiberCurrentPropsFromNode
} from 'protein/react-dom/internals'

import BaseWrapper from 'protein/wrappers/base'

export const renderedContainers = new Set()

export class TestingLibraryWrapper extends BaseWrapper {
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
export default TestingLibraryWrapper
