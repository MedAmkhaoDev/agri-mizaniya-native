import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/config/firebase'
import type { Profile } from './types'
import { migrateUserData } from './migrate'
import { useFarmStore } from './farm-store'
import { onesignalLogin, onesignalLogout } from './onesignal'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  migrating: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  runMigration: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  migrating: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
  runMigration: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [migrating, setMigrating] = useState(false)
  const migrationRan = useRef(false)

  const fetchProfile = async (userId: string) => {
    try {
      const docRef = doc(db, 'users', userId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() } as Profile)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid)
  }

  const runMigration = async () => {
    if (!user || !profile || migrating) return
    if (profile.farmIds && profile.farmIds.length > 0) return

    setMigrating(true)
    try {
      const result = await migrateUserData(user.uid, profile)
      if (result.success) {
        await refreshProfile()
      }
    } catch (error) {
      console.error('Migration failed:', error)
    } finally {
      setMigrating(false)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid)
        onesignalLogin(firebaseUser.uid)
      } else {
        setProfile(null)
        setMigrating(false)
        migrationRan.current = false
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Auto-migrate on first login after update
  useEffect(() => {
    if (user && profile && !loading && !migrationRan.current) {
      const needsMigration = !profile.farmIds || profile.farmIds.length === 0
      if (needsMigration) {
        migrationRan.current = true
        runMigration()
      }
    }
  }, [user, profile, loading])

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(credential.user, { displayName: fullName })
      await setDoc(doc(db, 'users', credential.user.uid), {
        fullName,
        email,
        preferredLanguage: 'fr',
        avatarUrl: null,
        currentFarmId: null,
        farmIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    onesignalLogout()
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, migrating, signIn, signUp, signOut, refreshProfile, runMigration }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
