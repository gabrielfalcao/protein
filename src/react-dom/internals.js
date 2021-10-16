import ReactDOM from 'react-dom'

const EventInternals =
  ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Events
export const ReactDOM_getInstanceFromNode = EventInternals[0]
export const getNodeFromInstance = EventInternals[1]
export const getFiberCurrentPropsFromNode = EventInternals[2]
export const enqueueStateRestore = EventInternals[3]
export const restoreStateIfNeeded = EventInternals[4]

// from react/packages/react-dom/src/client/ReactDOMComponentTree.js

const internalInstanceKey = /__reactFiber[$](\w+)/
const internalPropsKey = /__reactProps[$](\w+)/
const internalContainerInstanceKey = /__reactContainer[$](\w+)/
const internalEventHandlersKey = /__reactEvents[$](\w+)/
const internalEventHandlerListenersKey = /__reactListeners[$](\w+)/
const internalEventHandlesSetKey = /__reactHandles[$](\w+)/

export const getInstanceFromNode = (node) => {
  for (const [key, instance] of Object.entries(node)) {
    console.log(`${key} fail`)
    if (internalInstanceKey.test(key)) {
      console.warn(`${key} OK`, internalInstanceKey)
      return instance
    }
  }
  return ReactDOM_getInstanceFromNode(node)
}
