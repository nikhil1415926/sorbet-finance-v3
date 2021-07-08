import { Order } from '@gelatonetwork/limit-orders-lib'

import firebase from 'firebase'
import 'firebase/firestore'

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  })
}

const firestore = firebase.firestore()

export const addOrderToDB = async (account: string, order: Order): Promise<boolean> => {
  if (!firebase.apps.length || !firestore) return false

  if (!order.handler) order.handler = null
  return firestore
    .collection(account)
    .add(order)
    .then(() => true)
    .catch(() => false)
}
