import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import NameSection from 'src/kapacitor/components/NameSection'
import ValuesSection from 'src/kapacitor/components/ValuesSection'
import RuleHeader from 'src/kapacitor/components/RuleHeader'
import RuleHandlers from 'src/kapacitor/components/RuleHandlers'
import RuleMessage from 'src/kapacitor/components/RuleMessage'
import FancyScrollbar from 'shared/components/FancyScrollbar'

import {createRule, editRule} from 'src/kapacitor/apis'
import buildInfluxQLQuery from 'utils/influxql'
import {timeRanges} from 'shared/data/timeRanges'
import {DEFAULT_RULE_ID} from 'src/kapacitor/constants'
import {notify as notifyAction} from 'shared/actions/notifications'

import {
  NOTIFY_ALERT_RULE_CREATED,
  NOTIFY_ALERT_RULE_CREATION_FAILED,
  NOTIFY_ALERT_RULE_UPDATED,
  NOTIFY_ALERT_RULE_UPDATE_FAILED,
  NOTIFY_ALERT_RULE_REQUIRES_QUERY,
  NOTIFY_ALERT_RULE_REQUIRES_CONDITION_VALUE,
  NOTIFY_ALERT_RULE_DEADMAN_INVALID,
} from 'shared/copy/notifications'

class KapacitorRule extends Component {
  constructor(props) {
    super(props)
    this.state = {
      timeRange: timeRanges.find(tr => tr.lower === 'now() - 15m'),
    }
  }

  handleChooseTimeRange = ({lower}) => {
    const timeRange = timeRanges.find(range => range.lower === lower)
    this.setState({timeRange})
  }

  handleCreate = pathname => {
    const {notify, queryConfigs, rule, source, router, kapacitor} = this.props

    const newRule = Object.assign({}, rule, {
      query: queryConfigs[rule.queryID],
    })
    delete newRule.queryID

    createRule(kapacitor, newRule)
      .then(() => {
        router.push(pathname || `/sources/${source.id}/alert-rules`)
        notify(NOTIFY_ALERT_RULE_CREATED)
      })
      .catch(() => {
        notify(NOTIFY_ALERT_RULE_CREATION_FAILED)
      })
  }

  handleEdit = pathname => {
    const {notify, queryConfigs, rule, router, source} = this.props
    const updatedRule = Object.assign({}, rule, {
      query: queryConfigs[rule.queryID],
    })

    editRule(updatedRule)
      .then(() => {
        router.push(pathname || `/sources/${source.id}/alert-rules`)
        notify(NOTIFY_ALERT_RULE_UPDATED(rule.name))
      })
      .catch(e => {
        notify(NOTIFY_ALERT_RULE_UPDATE_FAILED(rule.name, e.data.message))
      })
  }

  handleSave = () => {
    const {rule} = this.props
    if (rule.id === DEFAULT_RULE_ID) {
      this.handleCreate()
    } else {
      this.handleEdit()
    }
  }

  handleSaveToConfig = configName => () => {
    const {rule, configLink, router} = this.props
    const pathname = `${configLink}#${configName}`
    if (this.validationError()) {
      router.push({
        pathname,
      })
      return
    }
    if (rule.id === DEFAULT_RULE_ID) {
      this.handleCreate(pathname)
    } else {
      this.handleEdit(pathname)
    }
  }

  handleAddEvery = frequency => {
    const {rule: {id: ruleID}, ruleActions: {addEvery}} = this.props
    addEvery(ruleID, frequency)
  }

  handleRemoveEvery = () => {
    const {rule: {id: ruleID}, ruleActions: {removeEvery}} = this.props
    removeEvery(ruleID)
  }

  validationError = () => {
    const {rule, query} = this.props
    if (rule.trigger === 'deadman') {
      return this.deadmanValidation()
    }

    if (!buildInfluxQLQuery({}, query)) {
      return NOTIFY_ALERT_RULE_REQUIRES_QUERY
    }

    if (!rule.values.value) {
      return NOTIFY_ALERT_RULE_REQUIRES_CONDITION_VALUE
    }

    return ''
  }

  deadmanValidation = () => {
    const {query} = this.props
    if (query && (!query.database || !query.measurement)) {
      return NOTIFY_ALERT_RULE_DEADMAN_INVALID
    }

    return ''
  }

  handleRuleTypeDropdownChange = ({type, text}) => {
    const {ruleActions, rule} = this.props
    ruleActions.updateRuleValues(rule.id, rule.trigger, {
      ...this.props.rule.values,
      [type]: text,
    })
  }

  handleRuleTypeInputChange = e => {
    const {ruleActions, rule} = this.props
    const {lower, upper} = e.target.form

    ruleActions.updateRuleValues(rule.id, rule.trigger, {
      ...this.props.rule.values,
      value: lower.value,
      rangeValue: upper ? upper.value : '',
    })
  }

  handleDeadmanChange = ({text}) => {
    const {ruleActions, rule} = this.props
    ruleActions.updateRuleValues(rule.id, rule.trigger, {period: text})
  }

  render() {
    const {
      rule,
      source,
      ruleActions,
      queryConfigs,
      handlersFromConfig,
      queryConfigActions,
    } = this.props
    const {chooseTrigger, updateRuleValues} = ruleActions
    const {timeRange} = this.state

    return (
      <div className="page">
        <RuleHeader
          source={source}
          onSave={this.handleSave}
          validationError={this.validationError()}
        />
        <FancyScrollbar className="page-contents fancy-scroll--kapacitor">
          <div className="container-fluid">
            <div className="row">
              <div className="col-xs-12">
                <div className="rule-builder">
                  <NameSection
                    rule={rule}
                    defaultName={rule.name}
                    onRuleRename={ruleActions.updateRuleName}
                  />
                  <ValuesSection
                    rule={rule}
                    source={source}
                    timeRange={timeRange}
                    onChooseTrigger={chooseTrigger}
                    onAddEvery={this.handleAddEvery}
                    onUpdateValues={updateRuleValues}
                    query={queryConfigs[rule.queryID]}
                    onRemoveEvery={this.handleRemoveEvery}
                    queryConfigActions={queryConfigActions}
                    onDeadmanChange={this.handleDeadmanChange}
                    onRuleTypeInputChange={this.handleRuleTypeInputChange}
                    onRuleTypeDropdownChange={this.handleRuleTypeDropdownChange}
                    onChooseTimeRange={this.handleChooseTimeRange}
                  />
                  <RuleHandlers
                    rule={rule}
                    ruleActions={ruleActions}
                    handlersFromConfig={handlersFromConfig}
                    onGoToConfig={this.handleSaveToConfig}
                    validationError={this.validationError()}
                  />
                  <RuleMessage rule={rule} ruleActions={ruleActions} />
                </div>
              </div>
            </div>
          </div>
        </FancyScrollbar>
      </div>
    )
  }
}

const {arrayOf, func, shape, string} = PropTypes

KapacitorRule.propTypes = {
  source: shape({}).isRequired,
  rule: shape({
    values: shape({}),
  }).isRequired,
  query: shape({}).isRequired,
  queryConfigs: shape({}).isRequired,
  queryConfigActions: shape({}).isRequired,
  ruleActions: shape({}).isRequired,
  notify: func.isRequired,
  ruleID: string.isRequired,
  handlersFromConfig: arrayOf(shape({})).isRequired,
  router: shape({
    push: func.isRequired,
  }).isRequired,
  kapacitor: shape({}).isRequired,
  configLink: string.isRequired,
}

const mapDispatchToProps = dispatch => ({
  notify: bindActionCreators(notifyAction, dispatch),
})

export default connect(null, mapDispatchToProps)(KapacitorRule)
