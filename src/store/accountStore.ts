import { create } from 'zustand'
import {
  getCurrentUser,
  loginAccount,
  logoutAccount,
  registerAccount,
  type ApiError,
} from '@/api/client'
import type { AuthUser } from '@/types/account'
import { useGameStore } from './gameStore'

interface AccountStore {
  user: AuthUser | null
  status: 'idle' | 'loading' | 'ready'
  error: string | null
  loadCurrentUser: () => Promise<void>
  signIn: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

function messageFromError(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Request failed.'
}

function applyUserCalibration(user: AuthUser | null) {
  if (user?.calibration) useGameStore.getState().applySavedCalibration(user.calibration)
}

export const useAccountStore = create<AccountStore>((set) => ({
  user: null,
  status: 'idle',
  error: null,

  loadCurrentUser: async () => {
    set({ status: 'loading', error: null })
    try {
      const user = await getCurrentUser()
      applyUserCalibration(user)
      set({ user, status: 'ready' })
    } catch (error) {
      set({ user: null, status: 'ready', error: messageFromError(error) })
    }
  },

  signIn: async (username, password) => {
    set({ status: 'loading', error: null })
    try {
      const user = await loginAccount(username, password)
      applyUserCalibration(user)
      set({ user, status: 'ready' })
    } catch (error) {
      set({ status: 'ready', error: messageFromError(error as ApiError) })
      throw error
    }
  },

  register: async (username, password) => {
    set({ status: 'loading', error: null })
    try {
      const user = await registerAccount(username, password)
      applyUserCalibration(user)
      set({ user, status: 'ready' })
    } catch (error) {
      set({ status: 'ready', error: messageFromError(error as ApiError) })
      throw error
    }
  },

  signOut: async () => {
    set({ status: 'loading', error: null })
    try {
      await logoutAccount()
      set({ user: null, status: 'ready' })
    } catch (error) {
      set({ status: 'ready', error: messageFromError(error) })
      throw error
    }
  },

  clearError: () => set({ error: null }),
}))
