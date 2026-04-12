import { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function hydrateUser(firebaseUser, fallback = {}) {
    let profile = {}

    try {
      const profileSnap = await getDoc(doc(db, 'users', firebaseUser.uid))
      if (profileSnap.exists()) profile = profileSnap.data()
    } catch {
      // Keep auth usable even when profile read fails.
    }

    const name = profile.displayName || profile.name || fallback.name || ''
    const role = (profile.role || fallback.role || '').toLowerCase()
    const mergedUser = {
      ...profile,
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      email: firebaseUser.email || profile.email || fallback.email || '',
      name,
      displayName: profile.displayName || name,
      role,
    }

    setUser(mergedUser)
    return mergedUser
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await hydrateUser(firebaseUser)
        } else {
          setUser(null)
        }
      } finally {
        setLoading(false)
      }
    })
    return unsubscribe
  }, [])

  async function register({ name, email, password, role }) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await setDoc(doc(db, 'users', cred.user.uid), {
        email,
        displayName: name,
        name,
        role,
        createdAt: serverTimestamp(),
      })
      await hydrateUser(cred.user, { name, role, email })
      return { success: true }
    } catch (err) {
      let message = 'Registration failed.'
      if (err.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists.'
      } else if (err.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.'
      }
      return { success: false, message }
    }
  }

  async function login({ email, password }) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      await hydrateUser(cred.user, { email })
      return { success: true }
    } catch (err) {
      let message = 'Invalid email or password.'
      if (err.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again later.'
      }
      return { success: false, message }
    }
  }

  async function logout() {
    await signOut(auth)
  }

  async function updateProfile(updates) {
    if (!user) return { success: false, message: 'Not logged in.' }
    try {
      await setDoc(doc(db, 'users', user.uid), updates, { merge: true })
      setUser((prev) => ({ ...prev, ...updates }))
      return { success: true }
    } catch {
      return { success: false, message: 'Failed to update profile.' }
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
