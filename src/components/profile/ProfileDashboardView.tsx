import { useEffect, useState } from 'react'
import { fetchProfile } from '@/api/client'
import { useAccountStore } from '@/store/accountStore'
import { useGameStore } from '@/store/gameStore'
import type { ProfileData } from '@/types/account'
import { RetroHeader } from '@/components/game/RetroHeader'
import {
  AppButton,
  ClassCard,
  DashboardShell,
  ErrorText,
  MetricBand,
  MetricItem,
  Panel,
  RunRow,
  SectionLabel,
} from '@/components/account/DashboardBits'

export function ProfileDashboardView() {
  const user = useAccountStore(s => s.user)
  const signOut = useAccountStore(s => s.signOut)
  const openAuth = useGameStore(s => s.openAuth)
  const goHome = useGameStore(s => s.goHome)
  const openClassDashboard = useGameStore(s => s.openClassDashboard)
  const selectedProfileUserId = useGameStore(s => s.selectedProfileUserId)
  const profileReturnClassId = useGameStore(s => s.profileReturnClassId)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [activeTab, setActiveTab] = useState<'runs' | 'classes'>('runs')
  const [error, setError] = useState<string | null>(null)
  const isOwnProfile = profile ? profile.userId === user?.id : !selectedProfileUserId

  const handleSignOut = async () => {
    setError(null)
    try {
      await signOut()
      goHome()
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'Sign out failed.')
    }
  }

  useEffect(() => {
    if (!user) {
      openAuth('profile')
      return
    }

    let cancelled = false
    setProfile(null)
    setError(null)
    fetchProfile(selectedProfileUserId)
      .then(data => {
        if (!cancelled) setProfile(data)
      })
      .catch(fetchError => {
        if (!cancelled) setError(fetchError instanceof Error ? fetchError.message : 'Profile failed to load.')
      })
    return () => {
      cancelled = true
    }
  }, [openAuth, selectedProfileUserId, user])

  const headerAction = profileReturnClassId ? (
    <AppButton
      type="button"
      variant="secondary"
      className="tt-button-compact"
      aria-label="Back to Class Dashboard"
      onClick={() => openClassDashboard(profileReturnClassId)}
    >
      Back
    </AppButton>
  ) : null

  return (
    <div className="app-shell min-h-screen">
      <RetroHeader />
      <DashboardShell headerAction={headerAction}>
        <ErrorText>{error}</ErrorText>
        <MetricBand className="md:grid-cols-6">
          <MetricItem label="Username" value={profile?.username ?? (isOwnProfile ? user?.username : '-') ?? '-'} />
          <MetricItem label="Runs Complete" value={profile?.summary.runCount ?? '-'} />
          <MetricItem label="Calibration WPM" value={profile ? Math.round(profile.summary.calibrationWpm) : '-'} />
          <MetricItem
            label="Difficulty bin"
            value={profile?.summary.displayBinLabel ? `${profile.summary.displayBinLabel} WPM` : '-'}
          />
          <MetricItem label="Classes Joined" value={profile?.summary.classesJoined ?? '-'} />
          <MetricItem label="Classes Teaching" value={profile?.summary.classesTeaching ?? '-'} />
        </MetricBand>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {(['runs', 'classes'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                className={`border-[2px] border-black px-4 py-2 text-sm font-bold capitalize ${activeTab === tab ? 'bg-black text-white' : 'bg-white'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          {isOwnProfile ? (
            <AppButton type="button" variant="secondary" className="min-h-10 px-3 py-2 text-sm" onClick={handleSignOut}>
              Sign Out
            </AppButton>
          ) : null}
        </div>

        {activeTab === 'runs' && (
          <Panel className="grid gap-3 p-4">
            <SectionLabel>Runs</SectionLabel>
            {profile && profile.runs.length > 0 ? (
              profile.runs.map(run => <RunRow key={run.id} run={run} />)
            ) : (
              <div className="border-[2px] border-black bg-white px-4 py-5 text-center text-sm font-bold text-[color:var(--tt-text-subtle)]">
                No saved runs yet.
              </div>
            )}
          </Panel>
        )}

        {activeTab === 'classes' && (
          <Panel className="grid gap-5 p-4">
            <div className="grid gap-3">
              <SectionLabel>Student classes</SectionLabel>
              {profile && profile.studentClasses.length > 0 ? (
                profile.studentClasses.map(item => <ClassCard key={item.id} item={item} />)
              ) : (
                <div className="tt-label">No joined classes.</div>
              )}
            </div>

            <div className="grid gap-3">
              <SectionLabel>Classes teaching</SectionLabel>
              {profile && profile.teachingClasses.length > 0 ? (
                profile.teachingClasses.map(item => (
                  <ClassCard key={item.id} item={item} onClick={isOwnProfile ? () => openClassDashboard(item.id) : undefined} />
                ))
              ) : (
                <div className="tt-label">No teaching classes.</div>
              )}
            </div>
          </Panel>
        )}
      </DashboardShell>
    </div>
  )
}
