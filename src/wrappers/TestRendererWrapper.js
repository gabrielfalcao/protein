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

import BaseWrapper from 'protein/wrappers/base'

export const mountedContainers = new Set()

export class TestRendererWrapper extends BaseWrapper {
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
export default TestRendererWrapper
