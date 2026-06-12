import { create } from 'zustand'
import {
  getCurrentUser,
  loginAccount,
  logoutAccount,
  registerAccount,
  type ApiError,
} from '@/api/client'
import type { AuthUser } from '@/types/account'

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

export const useAccountStore = create<AccountStore>((set) => ({
  user: null,
  status: 'idle',
  error: null,

  loadCurrentUser: async () => {
    set({ status: 'loading', error: null })
    try {
      set({ user: await getCurrentUser(), status: 'ready' })
    } catch (error) {
      set({ user: null, status: 'ready', error: messageFromError(error) })
    }
  },

  signIn: async (username, password) => {
    set({ status: 'loading', error: null })
    try {
      set({ user: await loginAccount(username, password), status: 'ready' })
    } catch (error) {
      set({ status: 'ready', error: messageFromError(error as ApiError) })
      throw error
    }
  },

  register: async (username, password) => {
    set({ status: 'loading', error: null })
    try {
      set({ user: await registerAccount(username, password), status: 'ready' })
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
