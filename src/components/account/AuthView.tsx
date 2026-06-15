import { type FormEvent, useEffect, useState } from 'react'
import { useAccountStore } from '@/store/accountStore'
import { useGameStore } from '@/store/gameStore'
import type { GamePhase } from '@/types/game'
import { RetroHeader } from '@/components/game/RetroHeader'
import { AppButton, DashboardShell, ErrorText, Field, Panel, SectionLabel } from './DashboardBits'

function routeAfterAuth(phase: GamePhase | null) {
  const store = useGameStore.getState()
  if (phase === 'joinClass') store.openJoinClass()
  else if (phase === 'instructorDashboard') store.openInstructorDashboard()
  else if (phase === 'globalData') store.openGlobalData()
  else store.openProfile()
}

export function AuthView() {
  const user = useAccountStore(s => s.user)
  const status = useAccountStore(s => s.status)
  const error = useAccountStore(s => s.error)
  const signIn = useAccountStore(s => s.signIn)
  const register = useAccountStore(s => s.register)
  const consumeReturnPhaseAfterAuth = useGameStore(s => s.consumeReturnPhaseAfterAuth)
  const [mode, setMode] = useState<'signIn' | 'register'>('signIn')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (user) routeAfterAuth(consumeReturnPhaseAfterAuth())
  }, [consumeReturnPhaseAfterAuth, user])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLocalError(null)
    try {
      if (mode === 'signIn') await signIn(username, password)
      else await register(username, password)
      routeAfterAuth(consumeReturnPhaseAfterAuth())
    } catch (submitError) {
      setLocalError(submitError instanceof Error ? submitError.message : 'Sign in failed.')
    }
  }

  return (
    <div className="app-shell min-h-screen">
      <RetroHeader />
      <DashboardShell>
        <Panel className="mx-auto grid w-full max-w-xl gap-4 p-5">
          <div className="flex gap-2 border-b-[3px] border-black pb-3">
            <button
              type="button"
              className={`border-[2px] border-black px-3 py-1 text-sm font-bold ${mode === 'signIn' ? 'bg-black text-white' : 'bg-white'}`}
              onClick={() => setMode('signIn')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`border-[2px] border-black px-3 py-1 text-sm font-bold ${mode === 'register' ? 'bg-black text-white' : 'bg-white'}`}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>

          <form className="grid gap-4" onSubmit={submit}>
            <SectionLabel>{mode === 'signIn' ? 'Existing player' : 'New player'}</SectionLabel>
            <Field label="Username" value={username} onChange={setUsername} required />
            <Field label="Password" value={password} onChange={setPassword} type="password" required />
            <ErrorText>{localError ?? error}</ErrorText>
            <AppButton type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Working...' : mode === 'signIn' ? 'Sign In' : 'Create Account'}
            </AppButton>
          </form>
        </Panel>
      </DashboardShell>
    </div>
  )
}
