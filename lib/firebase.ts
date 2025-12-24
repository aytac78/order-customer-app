// Firebase Cloud Messaging Configuration
import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

let messaging: Messaging | null = null

// Only initialize messaging on client side
if (typeof window !== 'undefined') {
  try {
    messaging = getMessaging(app)
  } catch (error) {
    console.error('Firebase messaging initialization error:', error)
  }
}

export { app, messaging }

// Get FCM Token
export async function getFCMToken(): Promise<string | null> {
  if (!messaging) return null

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('Notification permission denied')
      return null
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    })

    return token
  } catch (error) {
    console.error('Error getting FCM token:', error)
    return null
  }
}

// Listen for foreground messages
export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) return () => {}

  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload)
    callback(payload)
  })
}
