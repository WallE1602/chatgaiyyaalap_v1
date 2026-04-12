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
const USERS_KEY = 'chatgaiyyaalap_users'

function getStoredUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || []
  } catch {
    return []
  }
}

function storeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function findStoredUser({ uid, email }) {
  const users = getStoredUsers()
  return users.find((u) =>
    (uid && (u.uid === uid || u.id === uid)) ||
    (email && u.email === email),
  )
}

function upsertLocalUser(profile) {
  if (!profile?.uid && !profile?.id && !profile?.email) return

  const uid = profile.uid || profile.id
  const normalizedRole = (profile.role || '').toLowerCase()
  const nextUser = {
    id: uid || profile.id || '',
    uid: uid || profile.uid || '',
    email: profile.email || '',
    name: profile.name || profile.displayName || '',
    displayName: profile.displayName || profile.name || '',
    role: normalizedRole,
    avatar: profile.avatar || '',
  }

  const users = getStoredUsers()
  const index = users.findIndex((u) =>
    (uid && (u.uid === uid || u.id === uid)) ||
    (nextUser.email && u.email === nextUser.email),
  )

  if (index >= 0) {
    users[index] = { ...users[index], ...nextUser }
  } else {
    users.unshift(nextUser)
  }

  storeUsers(users)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function hydrateUser(firebaseUser, fallback = {}) {
    let profile = {}
    const cachedUser = findStoredUser({
      uid: firebaseUser.uid,
      email: firebaseUser.email || fallback.email,
    })

    try {
      const profileSnap = await getDoc(doc(db, 'users', firebaseUser.uid))
      if (profileSnap.exists()) profile = profileSnap.data()
    } catch {
      // Keep auth usable even when profile read fails.
    }

    const name = profile.displayName || profile.name || fallback.name || cachedUser?.name || ''
    const role = (profile.role || fallback.role || cachedUser?.role || '').toLowerCase()
    const mergedUser = {
      ...cachedUser,
      ...profile,
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      email: firebaseUser.email || profile.email || fallback.email || '',
      name,
      displayName: profile.displayName || name,
      role,
    }

    setUser(mergedUser)
    upsertLocalUser(mergedUser)
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
      upsertLocalUser({
        id: cred.user.uid,
        uid: cred.user.uid,
        email,
        name,
        displayName: name,
        role,
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
      const cachedUser = findStoredUser({ uid: cred.user.uid, email })
      await hydrateUser(cred.user, {
        email,
        role: cachedUser?.role,
        name: cachedUser?.name,
      })
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
      setUser((prev) => {
        const updated = { ...prev, ...updates }
        upsertLocalUser(updated)
        return updated
      })
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
