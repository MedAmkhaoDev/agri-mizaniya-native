import React, { createContext, useContext, useState, useEffect } from 'react'
import { useColorScheme as useRNColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useColorScheme } from 'nativewind'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'light',
})

const THEME_KEY = 'agri-mizane-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useRNColorScheme()
  const { setColorScheme } = useColorScheme()
  const [theme, setThemeState] = useState<Theme>('system')

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeState(stored)
        setColorScheme(stored)
      }
    })
  }, [])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    setColorScheme(newTheme)
    AsyncStorage.setItem(THEME_KEY, newTheme)
  }

  const resolvedTheme: 'light' | 'dark' =
    theme === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : theme

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
