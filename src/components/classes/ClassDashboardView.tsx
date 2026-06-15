import { useEffect, useRef, useState } from 'react'
import { fetchClassDashboard, removeStudent } from '@/api/client'
import { useAccountStore } from '@/store/accountStore'
import { useGameStore } from '@/store/gameStore'
import type { ClassDashboard, ClassDashboardStudent } from '@/types/account'
import { RetroHeader } from '@/components/game/RetroHeader'
import {
  AppButton,
  ClassCodeReveal,
  DashboardShell,
  ErrorText,
  MetricBand,
  MetricItem,
  Panel,
  SectionLabel,
} from '@/components/account/DashboardBits'

function StudentMenu({
  student,
  onView,
  onRemove,
}: {
  student: ClassDashboardStudent
  onView: () => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return
      setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const handleView = () => {
    setOpen(false)
    onView()
  }

  const handleRemove = () => {
    setOpen(false)
    onRemove()
  }

  return (
    <div ref={menuRef} className="relative justify-self-end">
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center bg-transparent text-2xl font-bold leading-none text-[color:var(--tt-text)] hover:text-[color:var(--tt-text-subtle)] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-black"
        aria-label={`Actions for ${student.studentName}`}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        ...
      </button>
      {open && (
        <div className="absolute top-full right-0 z-20 mt-1 flex min-w-48 flex-col border-[2px] border-black bg-white p-1 shadow-[3px_3px_0_#000]">
          <button type="button" className="whitespace-nowrap px-3 py-2 text-left text-sm font-bold hover:bg-gray-100" onClick={handleView}>
            View profile
          </button>
          <button type="button" className="whitespace-nowrap px-3 py-2 text-left text-sm font-bold text-[color:var(--tt-danger)] hover:bg-gray-100" onClick={handleRemove}>
            Remove student
          </button>
        </div>
      )}
    </div>
  )
}

export function ClassDashboardView() {
  const user = useAccountStore(s => s.user)
  const openAuth = useGameStore(s => s.openAuth)
  const selectedClassId = useGameStore(s => s.selectedClassId)
  const openInstructorDashboard = useGameStore(s => s.openInstructorDashboard)
  const openProfile = useGameStore(s => s.openProfile)
  const [dashboard, setDashboard] = useState<ClassDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = () => {
    if (!selectedClassId) return
    fetchClassDashboard(selectedClassId)
      .then(setDashboard)
      .catch(fetchError => setError(fetchError instanceof Error ? fetchError.message : 'Class dashboard failed to load.'))
  }

  useEffect(() => {
    if (!user) {
      openAuth('instructorDashboard')
      return
    }
    loadDashboard()
  }, [openAuth, selectedClassId, user])

  const viewProfile = (studentUserId: string) => {
    if (!selectedClassId) return
    openProfile(studentUserId, selectedClassId)
  }

  const remove = async (studentUserId: string) => {
    if (!selectedClassId) return
    setError(null)
    try {
      await removeStudent(selectedClassId, studentUserId)
      loadDashboard()
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Student removal failed.')
    }
  }

  return (
    <div className="app-shell min-h-screen">
      <RetroHeader />
      <DashboardShell
        label="Class Dashboard"
        headerAction={(
          <AppButton type="button" variant="secondary" className="min-h-10 px-3 py-2 text-sm" onClick={openInstructorDashboard}>
            Back to Instructor Dashboard
          </AppButton>
        )}
      >
        <ErrorText>{error}</ErrorText>
        <MetricBand className="md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <MetricItem label="Class Name" value={dashboard?.class.className ?? '-'} />
          <MetricItem label="Number of Students" value={dashboard?.class.studentCount ?? '-'} />
          <MetricItem label="Class Code" value={<ClassCodeReveal code={dashboard?.class.classCode} />} />
        </MetricBand>

        <Panel className="grid gap-3 p-4">
          <SectionLabel>Students</SectionLabel>
          {dashboard && dashboard.students.length > 0 ? (
            dashboard.students.map(student => (
              <div
                key={student.userId}
                className="grid gap-4 border-[2px] border-black bg-white px-4 py-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)_auto] lg:items-center"
              >
                <div>
                  <div className="font-bold">{student.studentName || 'Anon'}</div>
                  <div className="tt-label">{student.studentId ? `ID ${student.studentId}` : 'No student ID'}</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <MetricItem label="Runs Completed" value={student.runCount} />
                  <MetricItem label="Calibration WPM" value={student.calibrationWpm ? Math.round(student.calibrationWpm) : '-'} />
                  <MetricItem label="Simulations Run" value={student.simulationRunCount} />
                </div>
                <StudentMenu student={student} onView={() => viewProfile(student.userId)} onRemove={() => remove(student.userId)} />
              </div>
            ))
          ) : (
            <div className="border-[2px] border-black bg-white px-4 py-5 text-center text-sm font-bold text-[color:var(--tt-text-subtle)]">
              No students enrolled.
            </div>
          )}
        </Panel>
      </DashboardShell>

    </div>
  )
}
