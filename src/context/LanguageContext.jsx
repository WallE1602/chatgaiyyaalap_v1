import { createContext, useContext, useCallback, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import translations from '../i18n/translations'

const LanguageContext = createContext(null)
const LANG_KEY = 'chatgaiyyaalap_ui_lang'

export function LanguageProvider({ children }) {
  const { user, updateProfile, isAuthenticated } = useAuth()

  // Standalone localStorage pref for unauthenticated / first-time users
  const [guestLang, setGuestLang] = useState(() => {
    try {
      return localStorage.getItem(LANG_KEY) || 'en'
    } catch {
      return 'en'
    }
  })

  // Authenticated user's profile language takes priority
  const lang = isAuthenticated ? (user?.uiLanguage || guestLang) : guestLang

  // Sync guestLang from profile when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.uiLanguage) {
      setGuestLang(user.uiLanguage)
      localStorage.setItem(LANG_KEY, user.uiLanguage)
    }
  }, [isAuthenticated, user?.uiLanguage])

  const setLang = useCallback(
    (newLang) => {
      setGuestLang(newLang)
      localStorage.setItem(LANG_KEY, newLang)
      // Also persist to profile if logged in
      if (isAuthenticated) {
        updateProfile({ uiLanguage: newLang })
      }
    },
    [isAuthenticated, updateProfile],
  )

  const t = useCallback(
    (key) => {
      const keys = key.split('.')
      let val = translations[lang]
      for (const k of keys) {
        val = val?.[k]
      }
      // Fallback to English if key not found in current language
      if (val === undefined) {
        val = translations.en
        for (const k of keys) {
          val = val?.[k]
        }
      }
      return val ?? key
    },
    [lang],
  )

  return (
    <LanguageContext.Provider value={{ t, lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
