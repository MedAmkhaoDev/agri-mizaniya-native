import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import { Platform } from 'react-native'

export interface DiagnosticsReport {
  timestamp: string
  platform: string
  env: {
    webClientId: string | undefined
    webClientIdPrefix: string | undefined
  }
  config: {
    hasPreviousSignIn: boolean
    currentUser: string | null
  }
  playServices: boolean | 'skipped'
  signInSilently: 'available' | 'noSavedCredential' | { error: string }
  fullSignIn: {
    type: string
    user?: object
    idToken: string | null
    serverAuthCode: string | null
    scopes: string[]
  } | { error: string } | 'skipped'
  tokens: { idToken?: string; accessToken?: string } | { error: string } | 'skipped'
}

function mask(val: string | undefined): string | undefined {
  if (!val) return val
  return val.length > 15 ? val.slice(0, 12) + '...' : val
}

export async function runGoogleSignInDiagnostics(): Promise<DiagnosticsReport> {
  const report: DiagnosticsReport = {
    timestamp: new Date().toISOString(),
    platform: `${Platform.OS} ${Platform.Version}`,
    env: {
      webClientId: mask(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
      webClientIdPrefix: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.split('-')[0],
    },
    config: {
      hasPreviousSignIn: GoogleSignin.hasPreviousSignIn(),
      currentUser: GoogleSignin.getCurrentUser()?.user?.email ?? null,
    },
    playServices: 'skipped',
    signInSilently: 'noSavedCredential',
    fullSignIn: 'skipped',
    tokens: 'skipped',
  }

  // 1. Play Services (Android only)
  if (Platform.OS === 'android') {
    try {
      report.playServices = await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
    } catch (e: any) {
      report.playServices = { error: e.message ?? String(e) } as any
    }
  }

  // 2. Try signInSilently first
  try {
    const silent = await GoogleSignin.signInSilently()
    if (silent.type === 'success') {
      report.signInSilently = 'available'
      report.fullSignIn = {
        type: 'success',
        user: silent.data.user,
        idToken: silent.data.idToken,
        serverAuthCode: silent.data.serverAuthCode,
        scopes: silent.data.scopes,
      }
      // tokens available since we have a session
      try {
        const t = await GoogleSignin.getTokens()
        report.tokens = { idToken: mask(t.idToken), accessToken: mask(t.accessToken) }
      } catch (e: any) {
        report.tokens = { error: e.message ?? String(e) }
      }
      return report
    }
    report.signInSilently = 'noSavedCredential'
  } catch (e: any) {
    report.signInSilently = { error: `${e.code ?? ''}: ${e.message ?? e}` }
  }

  // 3. Full interactive sign-in (diagnostic only – will show the Google UI)
  try {
    const result = await GoogleSignin.signIn()
    if (result.type === 'success') {
      const data = result.data
      report.fullSignIn = {
        type: 'success',
        user: data.user,
        idToken: data.idToken,
        serverAuthCode: data.serverAuthCode,
        scopes: data.scopes,
      }

      // also fetch fresh tokens
      try {
        const t = await GoogleSignin.getTokens()
        report.tokens = { idToken: mask(t.idToken), accessToken: mask(t.accessToken) }
      } catch (e: any) {
        report.tokens = { error: e.message ?? String(e) }
      }

      // cleanup – sign out so the real signInWithGoogle flow can be tested fresh
      await GoogleSignin.signOut()
    } else {
      report.fullSignIn = { type: 'cancelled', idToken: null, serverAuthCode: null, scopes: [] }
    }
  } catch (e: any) {
    const code = e?.code ?? ''
    switch (code) {
      case statusCodes.SIGN_IN_CANCELLED:
        report.fullSignIn = { type: 'cancelled', idToken: null, serverAuthCode: null, scopes: [] }
        break
      case statusCodes.IN_PROGRESS:
        report.fullSignIn = { error: 'IN_PROGRESS – sign-in already in progress' }
        break
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        report.fullSignIn = { error: 'PLAY_SERVICES_NOT_AVAILABLE' }
        break
      default:
        report.fullSignIn = { error: `${code}: ${e.message ?? e}` }
    }
  }

  return report
}
