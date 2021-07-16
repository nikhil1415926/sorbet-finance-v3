import { useEffect, useReducer, useRef } from 'react'

interface State<T> {
  status: 'init' | 'pending' | 'rejected' | 'resolved'
  data?: T
  error?: Error
}

type Action<T> =
  | { type: 'request' }
  | { type: 'success'; payload: T }
  | { type: 'failure'; payload: Error }

function usePromise<T = unknown>(
  promise: Promise<T> | (() => Promise<T>), 
  inputs: Array<any>
): State<T> {
  const cancelRequest = useRef<boolean>(false)

  const initialState: State<T> = {
    status: 'init',
    error: undefined,
    data: undefined,
  }

  // Keep state logic separated
  const fetchReducer = (state: State<T>, action: Action<T>): State<T> => {
    switch (action.type) {
      case 'request':
        return { ...initialState, status: 'pending' }
      case 'success':
        return { ...initialState, status: 'resolved', data: action.payload }
      case 'failure':
        return { ...initialState, status: 'rejected', error: action.payload }
      default:
        return state
    }
  }

  const [state, dispatch] = useReducer(fetchReducer, initialState)

  const resolvePromise = (promise: Promise<T> | (() => Promise<T>)): Promise<T>  => {
    if (typeof promise === 'function') {
      return promise();
    }
  
    return promise;
  }

  useEffect(() => {
    const fetchRequest = resolvePromise(promise);

    if (!promise) {
      return;
    }

    const fetchData = async () => {
      dispatch({ type: 'request' })

      try {
        const response = await fetchRequest;

        if (cancelRequest.current) return

        dispatch({ type: 'success', payload: response })
      } catch (error) {
        if (cancelRequest.current) return

        dispatch({ type: 'failure', payload: error })
      }      
    }

    fetchData()

    return () => {
      cancelRequest.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, inputs)

  return state
}

export default usePromise