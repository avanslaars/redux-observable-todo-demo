import { combineEpics, ofType } from 'redux-observable'
// import { of, from, concat, merge } from 'rxjs'
import { of, from, merge } from 'rxjs'
import {
  map,
  switchMap,
  // ignoreElements,
  // tap,
  withLatestFrom,
  delay,
  takeUntil
} from 'rxjs/operators'
import {
  getTodos,
  createTodo,
  updateTodo,
  destroyTodo
} from '../lib/todoServices'
import { showMessage } from './messages'

const initState = {
  todos: [],
  currentTodo: ''
}

const TOGGLE_TODO = 'TOGGLE_TODO'
const SAVE_TODO = 'SAVE_TODO'
const FETCH_TODOS = 'FETCH_TODOS'
const DELETE_TODO = 'DELETE_TODO'
export const TODO_ADD = 'TODO_ADD'
export const TODOS_LOAD = 'TODOS_LOAD'
const CURRENT_UPDATE = 'CURRENT_UPDATE'
export const TODO_REPLACE = 'TODO_REPLACE'
export const TODO_REMOVE = 'TODO_REMOVE'

export const updateCurrent = val => ({ type: CURRENT_UPDATE, payload: val })
export const loadTodos = todos => ({ type: TODOS_LOAD, payload: todos })
export const addTodo = todo => ({ type: TODO_ADD, payload: todo })
export const replaceTodo = todo => ({ type: TODO_REPLACE, payload: todo })
export const removeTodo = id => ({ type: TODO_REMOVE, payload: id })

// Used to be thunks, now standard action creators
export const fetchTodos = () => ({ type: FETCH_TODOS })
export const saveTodo = name => ({ type: SAVE_TODO, payload: name })
export const toggleTodo = id => ({ type: TOGGLE_TODO, payload: id })
export const deleteTodo = id => ({ type: DELETE_TODO, payload: id })

// TODO: replace with epic
// export const fetchTodos = () => {
//   return dispatch => {
//     dispatch(showMessage('Loading Todos'))
//     getTodos().then(todos => dispatch(loadTodos(todos)))
//   }
// }

// export const fetchTodosEpic = action$ =>
//   action$.pipe(
//     ofType(FETCH_TODOS),
//     switchMap(() =>
//       concat(
//         of(showMessage('Loading Todos - Rx style')),
//         from(getTodos()).pipe(map(loadTodos))
//       )
//     )
//   )

// Delay the message and only show it when the request takes too long
export const fetchTodosEpic = action$ =>
  action$.pipe(
    ofType(FETCH_TODOS),
    switchMap(() => {
      // define the load$ - delay is for demo purposes
      const load$ = from(getTodos()).pipe(map(loadTodos), delay(2000))
      // define message display - delay to avoid flash, takeUntil to cancel if ajax finishes first
      const message$ = of(showMessage('Loading Todos - Rx style')).pipe(
        delay(1000),
        takeUntil(load$)
      )
      // send actions for both load$ & message$ as they come in
      return merge(message$, load$)
    })
  )

// TODO: replace with epic
// export const saveTodo = name => {
//   return dispatch => {
//     dispatch(showMessage('Saving Todo'))
//     createTodo(name).then(res => dispatch(addTodo(res)))
//   }
// }

export const saveTodoEpic = action$ =>
  action$.pipe(
    ofType(SAVE_TODO),
    switchMap(({ payload }) => {
      const create$ = from(createTodo(payload)).pipe(map(res => addTodo(res)))
      const message$ = of(showMessage('Saving todo')).pipe(
        delay(300),
        takeUntil(create$)
      )
      return merge(message$, create$)
    })
  )

// TODO: replace with epic

// export const toggleTodo = id => {
//   return (dispatch, getState) => {
//     dispatch(showMessage('Saving todo update'))
//     const { todos } = getState().todo
//     const todo = todos.find(t => t.id === id)
//     const toggled = { ...todo, isComplete: !todo.isComplete }
//     updateTodo(toggled).then(res => dispatch(replaceTodo(res)))
//   }
// }
export const toggleTodoEpic = (action$, state$) =>
  action$.pipe(
    ofType(TOGGLE_TODO),
    withLatestFrom(state$),
    switchMap(([action, state]) => {
      const id = action.payload
      const { todos } = state.todo
      const todo = todos.find(t => t.id === id)
      const toggled = { ...todo, isComplete: !todo.isComplete }
      const update$ = from(updateTodo(toggled)).pipe(map(replaceTodo))
      const message$ = of(showMessage('Saving todo update')).pipe(
        delay(300),
        takeUntil(update$)
      )
      return merge(update$, message$)
    })
  )
// return (dispatch, getState) => {
//   dispatch(showMessage('Saving todo update'))
//   const { todos } = getState().todo
//   const todo = todos.find(t => t.id === id)
//   const toggled = { ...todo, isComplete: !todo.isComplete }
//   updateTodo(toggled).then(res => dispatch(replaceTodo(res)))
// }

// TODO: replace with epic
// export const deleteTodo = id => {
//   return dispatch => {
//     dispatch(showMessage('Removing Todo'))
//     destroyTodo(id).then(() => dispatch(removeTodo(id)))
//   }
// }

export const deleteTodoEpic = action$ =>
  action$.pipe(
    ofType(DELETE_TODO),
    switchMap(({ payload }) => {
      const id = payload
      const delete$ = from(destroyTodo(id)).pipe(map(() => removeTodo(id)))
      const message$ = of(showMessage('Removing Todo')).pipe(
        delay(300),
        takeUntil(delete$)
      )
      return merge(delete$, message$)
    })
  )

export const rootEpic = combineEpics(
  fetchTodosEpic,
  saveTodoEpic,
  toggleTodoEpic,
  deleteTodoEpic
)

export const getVisibleTodos = (todos, filter) => {
  switch (filter) {
    case 'active':
      return todos.filter(t => !t.isComplete)
    case 'completed':
      return todos.filter(t => t.isComplete)
    default:
      return todos
  }
}

export default (state = initState, action) => {
  switch (action.type) {
    case TODO_ADD:
      return {
        ...state,
        currentTodo: '',
        todos: state.todos.concat(action.payload)
      }
    case TODOS_LOAD:
      return { ...state, todos: action.payload }
    case CURRENT_UPDATE:
      return { ...state, currentTodo: action.payload }
    case TODO_REPLACE:
      return {
        ...state,
        todos: state.todos.map(
          t => (t.id === action.payload.id ? action.payload : t)
        )
      }
    case TODO_REMOVE:
      return {
        ...state,
        todos: state.todos.filter(t => t.id !== action.payload)
      }
    default:
      return state
  }
}
