import { configureStore } from '@reduxjs/toolkit'
import { save, load } from 'redux-localstorage-simple'
import user from './user/reducer'
import pool from './pool/reducer'
import application from './application/reducer'
import { gelatoReducers, GELATO_PERSISTED_KEYS } from '@gelatonetwork/limit-orders-react'

const PERSISTED_KEYS: string[] = ['user', ...GELATO_PERSISTED_KEYS]

const store = configureStore({
  reducer: {
    user,
    application,
    pool,
    ...gelatoReducers,
  },
  middleware: [
    // ...getDefaultMiddleware({ thunk: false }),
    save({ states: PERSISTED_KEYS, debounce: 1000 }),
  ],
  preloadedState: load({ states: PERSISTED_KEYS }),
})

export default store

export type AppState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
