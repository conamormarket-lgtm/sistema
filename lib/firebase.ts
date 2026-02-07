/**
 * Inicialización de Firebase (solo en cliente).
 * Para usar Firestore real, define NEXT_PUBLIC_USE_FIREBASE=true y las variables de abajo.
 */
import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getFirestore, Firestore } from "firebase/firestore"
import { getAuth, Auth } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

let app: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null
  if (!app && firebaseConfig.apiKey && firebaseConfig.projectId) {
    if (getApps().length > 0) app = getApps()[0] as FirebaseApp
    else app = initializeApp(firebaseConfig as any)
  }
  return app
}

export function getDb(): Firestore | null {
  if (typeof window === "undefined") return null
  if (!db) {
    const a = getFirebaseApp()
    if (a) db = getFirestore(a)
  }
  return db
}

export function getAuthInstance(): Auth | null {
  if (typeof window === "undefined") return null
  if (!auth) {
    const a = getFirebaseApp()
    if (a) auth = getAuth(a)
  }
  return auth
}

export const useFirebase = typeof window !== "undefined" && process.env.NEXT_PUBLIC_USE_FIREBASE === "true"
