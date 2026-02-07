/**
 * Inicialización de Firebase (solo en cliente).
 * Para usar Firestore real, define NEXT_PUBLIC_USE_FIREBASE=true y las variables de abajo.
 */
import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getFirestore, Firestore } from "firebase/firestore"
import { getAuth, Auth } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyA8ucZlgKwIyxBiGk_mVtM5_16bDSLoxr8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "base-de-datos-30caf.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "base-de-datos-30caf",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "base-de-datos-30caf.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "226160803440",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:226160803440:web:9bef2d7a901851ac323eb5",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-YLXB9XPV8H",
}

let app: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null
  if (!app) {
    if (getApps().length > 0) app = getApps()[0] as FirebaseApp
    else app = initializeApp(firebaseConfig)
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
