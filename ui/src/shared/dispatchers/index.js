import {notify} from 'shared/actions/notifications'
import {delayEnablePresentationMode} from 'shared/actions/app'
import {NOTIFY_PRESENTATION_MODE} from 'shared/copy/notifications'

export const presentationButtonDispatcher = dispatch => () => {
  dispatch(delayEnablePresentationMode())
  dispatch(notify(NOTIFY_PRESENTATION_MODE))
}
