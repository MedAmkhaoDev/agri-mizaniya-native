import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { I18nManager, Platform } from 'react-native'
import { translations, type Language, type Translations } from './i18n'

interface I18nContextType {
  language: Language
  t: Translations
  isRTL: boolean
  setLanguage: (lang: Language) => void
}

const I18nContext = createContext<I18nContextType>({
  language: 'fr',
  t: translations.fr,
  isRTL: false,
  setLanguage: () => {},
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr')

  const applyRTL = (rtl: boolean, lang: string) => {
    if (Platform.OS === 'web') {
      if (typeof document !== 'undefined') {
        document.documentElement.dir = rtl ? 'rtl' : 'ltr'
        document.documentElement.lang = lang
      }
    } else {
      I18nManager.forceRTL(rtl)
      I18nManager.allowRTL(rtl)
    }
  }

  useEffect(() => {
    AsyncStorage.getItem('language').then((stored) => {
      if (stored && (stored === 'fr' || stored === 'en' || stored === 'ar')) {
        setLanguageState(stored)
        applyRTL(stored === 'ar', stored)
      }
    })
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    AsyncStorage.setItem('language', lang)
    applyRTL(lang === 'ar', lang)
  }

  const isRTL = language === 'ar'
  const t = translations[language] as Translations

  return (
    <I18nContext.Provider value={{ language, t, isRTL, setLanguage }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
