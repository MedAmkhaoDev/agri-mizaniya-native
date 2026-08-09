import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Platform } from 'react-native'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function buildJoinUrl(code: string): string {
  if (Platform.OS === 'web') {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return `${origin}/join?code=${code}`
  }
  return `agri-mizaniya://join?code=${code}`
}
