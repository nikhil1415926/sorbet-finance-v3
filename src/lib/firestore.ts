import { Order } from '@gelatonetwork/limit-orders-lib'

import firebase from 'firebase/app'
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

export const addOrderToDB = async (chainId: number, account: string, order: Order): Promise<boolean> => {
  if (!firebase.apps.length || !firestore) return false

  if (!order.handler) order.handler = null

  console.log('chainId', chainId)
  console.log('account', account)
  console.log('order', order)

  return firestore
    .collection('orders')
    .doc(chainId.toString())
    .collection(account.toLowerCase())
    .doc(order.id.toLowerCase())
    .set(order)
    .then(() => true)
    .catch(() => false)
}
