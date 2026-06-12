import { type FormEvent, type ReactNode, useEffect, useState } from 'react'
import { createClass, fetchInstructorDashboard, saveInstructorName } from '@/api/client'
import { useAccountStore } from '@/store/accountStore'
import { useGameStore } from '@/store/gameStore'
import type { InstructorDashboard } from '@/types/account'
import { RetroHeader } from '@/components/game/RetroHeader'
import {
  AppButton,
  ClassCard,
  DashboardShell,
  ErrorText,
  Field,
  MetricBand,
  MetricItem,
  Panel,
  SectionLabel,
} from '@/components/account/DashboardBits'

function ModalShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 px-4">
      <Panel variant="modal" className="grid w-full max-w-xl gap-4 p-5">
        <SectionLabel>{title}</SectionLabel>
        {children}
      </Panel>
    </div>
  )
}

function NewClassTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="grid min-h-24 items-center justify-center gap-3 border-[3px] border-black bg-white px-4 py-3 transition-colors hover:bg-[color:var(--tt-surface-raised)] sm:grid-cols-[minmax(0,1fr)_auto]"
      aria-label="New class"
      onClick={onClick}
    >
      <span className="col-span-full justify-self-center text-7xl font-bold leading-none" aria-hidden="true">+</span>
    </button>
  )
}

export function InstructorDashboardView() {
  const user = useAccountStore(s => s.user)
  const openAuth = useGameStore(s => s.openAuth)
  const openClassDashboard = useGameStore(s => s.openClassDashboard)
  const [dashboard, setDashboard] = useState<InstructorDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isNameOpen, setIsNameOpen] = useState(false)
  const [isClassOpen, setIsClassOpen] = useState(false)
  const [instructorName, setInstructorName] = useState('')
  const [className, setClassName] = useState('')
  const [requiresStudentId, setRequiresStudentId] = useState(false)
  const [requiresStudentName, setRequiresStudentName] = useState(false)

  const loadDashboard = () => {
    fetchInstructorDashboard()
      .then(data => {
        setDashboard(data)
        setIsNameOpen(data.instructor === null)
      })
      .catch(fetchError => setError(fetchError instanceof Error ? fetchError.message : 'Instructor dashboard failed to load.'))
  }

  useEffect(() => {
    if (!user) {
      openAuth('instructorDashboard')
      return
    }
    loadDashboard()
  }, [openAuth, user])

  const submitInstructorName = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      await saveInstructorName(instructorName)
      setIsNameOpen(false)
      loadDashboard()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Instructor name failed to save.')
    }
  }

  const submitClass = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      await createClass({ className, requiresStudentId, requiresStudentName })
      setClassName('')
      setRequiresStudentId(false)
      setRequiresStudentName(false)
      setIsClassOpen(false)
      loadDashboard()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Class failed to create.')
    }
  }

  return (
    <div className="app-shell min-h-screen">
      <RetroHeader />
      <DashboardShell>
        <ErrorText>{error}</ErrorText>
        <MetricBand className="md:grid-cols-[minmax(0,1fr)_repeat(2,auto)]">
          <MetricItem label="Instructor Name" value={dashboard?.instructor?.name ?? '-'} />
          <MetricItem label="Number of Classes" value={dashboard?.totals.classCount ?? '-'} />
          <MetricItem label="Number of Students" value={dashboard?.totals.studentCount ?? '-'} />
        </MetricBand>

        <div className="grid gap-3 md:grid-cols-2">
          <NewClassTile onClick={() => setIsClassOpen(true)} />
          {dashboard?.classes.map(item => (
            <ClassCard key={item.id} item={item} onClick={() => openClassDashboard(item.id)} />
          ))}
        </div>
      </DashboardShell>

      {isNameOpen && (
        <ModalShell title="Instructor Name">
          <form className="grid gap-4" onSubmit={submitInstructorName}>
            <Field label="Instructor Name" value={instructorName} onChange={setInstructorName} required />
            <AppButton type="submit">Save</AppButton>
          </form>
        </ModalShell>
      )}

      {isClassOpen && (
        <ModalShell title="Class Info">
          <form className="grid gap-4" onSubmit={submitClass}>
            <Field label="Class Name" value={className} onChange={setClassName} required />
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={requiresStudentId} onChange={event => setRequiresStudentId(event.target.checked)} />
              Student ID
            </label>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={requiresStudentName} onChange={event => setRequiresStudentName(event.target.checked)} />
              Student Name
            </label>
            <div className="flex justify-end gap-2">
              <AppButton type="button" variant="secondary" onClick={() => setIsClassOpen(false)}>Cancel</AppButton>
              <AppButton type="submit">Create</AppButton>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  )
}
