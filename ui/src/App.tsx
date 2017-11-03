import * as React from 'react'
import * as PropTypes from 'prop-types'

import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import SideNav from './side_nav/containers/SideNav'
import Notifications from './shared/components/Notifications'

import {publishNotification} from './shared/actions/notifications'

const {func, node} = PropTypes

class App extends React.Component {
  propTypes = {
    children: node.isRequired,
    notify: func.isRequired,
  }

  handleAddFlashMessage = ({type, text}) => {
    const {notify} = this.props

    notify(type, text)
  }

  render() {
    return (
      <div className="chronograf-root">
        <Notifications />
        <SideNav />
        {this.props.children &&
          React.cloneElement(this.props.children, {
            addFlashMessage: this.handleAddFlashMessage,
          })}
      </div>
    )
  }
}

const mapDispatchToProps = dispatch => ({
  notify: bindActionCreators(publishNotification, dispatch),
})

export default connect(null, mapDispatchToProps)(App)
