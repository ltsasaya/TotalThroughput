import { useEffect, useState } from 'react'
import { fetchClassDashboard, fetchClassStudentProfile, removeStudent } from '@/api/client'
import { useAccountStore } from '@/store/accountStore'
import { useGameStore } from '@/store/gameStore'
import type { ClassDashboard, ClassStudentProfile, ClassDashboardStudent } from '@/types/account'
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
  return (
    <div className="relative">
      <button
        type="button"
        className="border-[2px] border-black px-2 py-1 font-bold"
        aria-label={`Actions for ${student.studentName}`}
        onClick={() => setOpen(value => !value)}
      >
        ...
      </button>
      {open && (
        <div className="absolute right-0 z-20 grid min-w-36 gap-1 border-[2px] border-black bg-white p-1 shadow-[3px_3px_0_#000]">
          <button type="button" className="px-3 py-2 text-left text-sm font-bold hover:bg-gray-100" onClick={onView}>
            View profile
          </button>
          <button type="button" className="px-3 py-2 text-left text-sm font-bold text-[color:var(--tt-danger)] hover:bg-gray-100" onClick={onRemove}>
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
  const [dashboard, setDashboard] = useState<ClassDashboard | null>(null)
  const [profile, setProfile] = useState<ClassStudentProfile | null>(null)
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

  const viewProfile = async (studentUserId: string) => {
    if (!selectedClassId) return
    setError(null)
    try {
      setProfile(await fetchClassStudentProfile(selectedClassId, studentUserId))
    } catch (viewError) {
      setError(viewError instanceof Error ? viewError.message : 'Student profile failed to load.')
    }
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

      {profile && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 px-4">
          <Panel variant="modal" className="grid max-h-[80vh] w-full max-w-2xl gap-3 overflow-auto p-5">
            <SectionLabel>Student profile</SectionLabel>
            {profile.runs.length > 0 ? profile.runs.map(run => (
              <div key={run.id} className="grid gap-2 border-[2px] border-black px-3 py-2">
                <div className="font-bold">{run.difficultyLabel}</div>
                <div className="tt-label">{new Date(run.completedAt).toLocaleString()}</div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <MetricItem label="Completed" value={run.completedCount} />
                  <MetricItem label="Avg R" value={`${(run.averageResponseTime / 1000).toFixed(2)}s`} />
                  <MetricItem label="Avg Queue" value={run.averageQueueLength.toFixed(1)} />
                </div>
              </div>
            )) : (
              <div className="tt-label">No class-scoped runs yet.</div>
            )}
            <AppButton type="button" variant="secondary" onClick={() => setProfile(null)}>Close</AppButton>
          </Panel>
        </div>
      )}
    </div>
  )
}
