import React from 'react'
import { render } from '..'

class MyComponent extends React.Component {
  state = {
    offerVisible: this.props.dockSize === 'standard',
    meterVisible: this.props.dockSize !== 'standard',
    toggleChangedMessages: false,
    showFocus: false,
    coloredHeading: false
  }

  onDockHeadingKeyUp = (evt) => {
    if (evt.keyCode === 9) {
      this.setState({ showFocus: true })
    }
  }

  static getDerivedStateFromProps(props, state) {
    const { scrollThresholdMet, dockSize, dockExpanded } = props
    const { meterVisible, offerVisible } = state
    const newState = {}
    console.warn({
      dockExpanded,
      meterVisible,
      offerVisible
    })

    if (scrollThresholdMet) {
      if (dockSize === 'standard') {
        newState.coloredHeading = true
      } else {
        newState.meterVisible = false
        newState.offerVisible = true
      }
      console.error('scrollThresholdMet', { newState })
    }

    if (dockExpanded && !meterVisible) {
      console.warn('meter invisible with dockExpanded', { newState })
      newState.meterVisible = true
      newState.offerVisible = false
      newState.toggleChangedMessages = true
    }

    if (!dockExpanded && !offerVisible) {
      console.warn('offer invisible with dockExpanded', { newState })
      newState.meterVisible = false
      newState.offerVisible = true
      newState.toggleChangedMessages = true
    }

    if (Object.keys(newState).length > 0) {
      return newState
    }

    return null
  }

  render() {
    const {
      contentID,
      dockSize,
      isDockDismissible,
      dockExpanded,
      headerCTA,
      header2,
      header1,
      onDockHeadingClick,
      onDockCTAClick,
      headerCollapsedCTA,
      headerExpandedCTA
    } = this.props
    const { offerVisible, meterVisible, toggleChangedMessages } = this.state

    let headerTestID
    if (dockSize === 'standard') {
      headerTestID = 'standard-dock-heading-selector'
    } else {
      headerTestID = 'expanded-dock-heading-selector'
    }

    return (
      <div data-testid='contentID' data-value={contentID}>
        <ul data-testid='dockSize' data-value={dockSize}>
          <li data-testid='isDockDismissible' data-value={isDockDismissible}>
            isDockDismissible
          </li>
          <li data-testid='offerVisible' data-value={offerVisible}>
            offerVisible
          </li>
          <li data-testid='meterVisible' data-value={meterVisible}>
            meterVisible
          </li>
          <li
            data-testid='toggleChangedMessages'
            data-value={toggleChangedMessages}
          >
            toggleChangedMessages
          </li>
          <li data-testid='dockExpanded' data-value={dockExpanded}>
            dockExpanded
          </li>
          <li data-testid='header1' data-value={header1}>
            header1
          </li>
          <li data-testid='header2' data-value={header2}>
            header2
          </li>

          <li data-testid='headerCollapsedCTA' data-value={headerCollapsedCTA}>
            headerCollapsedCTA
          </li>
          <li data-testid='headerExpandedCTA' data-value={headerExpandedCTA}>
            headerExpandedCTA
          </li>
        </ul>
      </div>
    )
  }
}

describe('render', () => {
  describe('returns wrapper', () => {
    it('is truthy', () => {
      const wrapper = render(<MyComponent />)

      expect(wrapper.instance).not.toBe(null)
    })
  })
})
