import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: 'AIzaSyAjmQmqKybLFz3xNGQJvoTgphAQfdQxbiM',
  authDomain: 'chatgaiyyaalap.firebaseapp.com',
  projectId: 'chatgaiyyaalap',
  storageBucket: 'chatgaiyyaalap.firebasestorage.app',
  messagingSenderId: '230950603465',
  appId: '1:230950603465:web:78559c34f608a238951b18',
  measurementId: 'G-TVME5CBQT9',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

// Analytics is optional and unsupported in some browser environments.
if (typeof window !== 'undefined') {
  isSupported().then((ok) => {
    if (ok) getAnalytics(app)
  }).catch(() => {})
}

export default app
