import { type FormEvent, useEffect, useState } from 'react'
import { checkClass, joinClass } from '@/api/client'
import { useAccountStore } from '@/store/accountStore'
import { useGameStore } from '@/store/gameStore'
import type { JoinClassCheck } from '@/types/account'
import { RetroHeader } from '@/components/game/RetroHeader'
import { AppButton, DashboardShell, ErrorText, Field, Panel, SectionLabel } from '@/components/account/DashboardBits'

export function JoinClassView() {
  const user = useAccountStore(s => s.user)
  const openAuth = useGameStore(s => s.openAuth)
  const openProfile = useGameStore(s => s.openProfile)
  const [classCode, setClassCode] = useState('')
  const [studentName, setStudentName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [checkedClass, setCheckedClass] = useState<JoinClassCheck | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) openAuth('joinClass')
  }, [openAuth, user])

  const submitCheck = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    try {
      setCheckedClass(await checkClass(classCode))
    } catch (checkError) {
      setError(checkError instanceof Error ? checkError.message : 'Class check failed.')
    }
  }

  const submitJoin = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    try {
      await joinClass({ classCode, studentName, studentId })
      setMessage('Class joined.')
    } catch (joinError) {
      const nextMessage = joinError instanceof Error ? joinError.message : 'Join class failed.'
      if (nextMessage === 'Request failed.') setError('Join class failed.')
      else if (nextMessage === 'You are already enrolled.') setMessage(nextMessage)
      else setError(nextMessage)
    }
  }

  return (
    <div className="app-shell min-h-screen">
      <RetroHeader />
      <DashboardShell>
        <Panel className="mx-auto grid w-full max-w-2xl gap-4 p-5">
          <ErrorText>{error}</ErrorText>
          {message && (
            <div className="border-[2px] border-black bg-white px-3 py-2 text-sm font-bold">
              {message}
            </div>
          )}

          {!checkedClass ? (
            <form className="grid gap-4" onSubmit={submitCheck}>
              <Field label="Class Code" value={classCode} onChange={setClassCode} required />
              <AppButton type="submit">Enter</AppButton>
            </form>
          ) : (
            <form className="grid gap-4" onSubmit={submitJoin}>
              <SectionLabel>{checkedClass.class.className}</SectionLabel>
              <Field
                label={checkedClass.class.requiresStudentName ? 'Name' : 'Name (optional)'}
                value={studentName}
                onChange={setStudentName}
                required={checkedClass.class.requiresStudentName}
              />
              <Field
                label={checkedClass.class.requiresStudentId ? 'Student ID' : 'Student ID (optional)'}
                value={studentId}
                onChange={setStudentId}
                required={checkedClass.class.requiresStudentId}
              />
              <div className="flex justify-end gap-2">
                <AppButton type="button" variant="secondary" onClick={() => setCheckedClass(null)}>Back</AppButton>
                <AppButton type="submit">Join</AppButton>
              </div>
            </form>
          )}

          {message === 'Class joined.' && (
            <AppButton type="button" variant="secondary" onClick={() => openProfile()}>
              View Profile
            </AppButton>
          )}
        </Panel>
      </DashboardShell>
    </div>
  )
}
