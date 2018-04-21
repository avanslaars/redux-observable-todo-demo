import { createStore, applyMiddleware, combineReducers } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import { createEpicMiddleware } from 'redux-observable'
import todoReducer, { rootEpic } from './reducers/todo'
import messageReducer from './reducers/messages'

const reducer = combineReducers({
  todo: todoReducer,
  message: messageReducer
})

const epicMiddleware = createEpicMiddleware(rootEpic)

export default createStore(
  reducer,
  composeWithDevTools(applyMiddleware(epicMiddleware))
)
