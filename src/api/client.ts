import type { Phase1RunRecord } from '@/types/metrics'
import type {
  AuthUser,
  ClassDashboard,
  ClassStudentProfile,
  GlobalDataPoint,
  InstructorDashboard,
  JoinClassCheck,
  ProfileData,
} from '@/types/account'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function apiRequest<T>(
  path: string,
  options: RequestInit & { allowUnauthorized?: boolean } = {},
): Promise<T | null> {
  const response = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  if (response.status === 204) return null
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (options.allowUnauthorized && response.status === 401) return null
    const message = typeof body.error === 'string'
      ? body.error
      : typeof body.message === 'string'
        ? body.message
        : 'Request failed.'
    throw new ApiError(response.status, message)
  }
  return body as T
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const data = await apiRequest<{ user: AuthUser | null }>('/api/auth/me')
  return data?.user ?? null
}

export async function registerAccount(username: string, password: string): Promise<AuthUser> {
  const data = await apiRequest<{ user: AuthUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  return data!.user
}

export async function loginAccount(username: string, password: string): Promise<AuthUser> {
  const data = await apiRequest<{ user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  return data!.user
}

export async function logoutAccount() {
  await apiRequest('/api/auth/logout', { method: 'POST', allowUnauthorized: true })
}

export async function fetchProfile(): Promise<ProfileData> {
  return (await apiRequest<ProfileData>('/api/profile'))!
}

export async function fetchInstructorDashboard(): Promise<InstructorDashboard> {
  return (await apiRequest<InstructorDashboard>('/api/instructor/dashboard'))!
}

export async function saveInstructorName(instructorName: string) {
  return apiRequest('/api/instructor/profile', {
    method: 'POST',
    body: JSON.stringify({ instructorName }),
  })
}

export async function createClass(input: {
  className: string
  requiresStudentId: boolean
  requiresStudentName: boolean
}) {
  return apiRequest<{ class: { id: string; className: string; classCode: string; studentCount: number } }>(
    '/api/classes',
    { method: 'POST', body: JSON.stringify(input) },
  )
}

export async function checkClass(classCode: string): Promise<JoinClassCheck> {
  return (await apiRequest<JoinClassCheck>('/api/classes/check', {
    method: 'POST',
    body: JSON.stringify({ classCode }),
  }))!
}

export async function joinClass(input: {
  classCode: string
  studentName: string
  studentId: string
}) {
  return apiRequest<{ class: { id: string; className: string } }>('/api/classes/join', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function fetchClassDashboard(classId: string): Promise<ClassDashboard> {
  return (await apiRequest<ClassDashboard>(`/api/classes/${encodeURIComponent(classId)}/dashboard`))!
}

export async function removeStudent(classId: string, studentUserId: string) {
  await apiRequest(`/api/classes/${encodeURIComponent(classId)}/students/${encodeURIComponent(studentUserId)}`, {
    method: 'DELETE',
  })
}

export async function fetchClassStudentProfile(classId: string, studentUserId: string): Promise<ClassStudentProfile> {
  return (await apiRequest<ClassStudentProfile>(
    `/api/classes/${encodeURIComponent(classId)}/students/${encodeURIComponent(studentUserId)}/profile`,
  ))!
}

export async function fetchGlobalData(
  wpmMin: number,
  wpmMax: number,
): Promise<GlobalDataPoint[]> {
  const query = new URLSearchParams({ wpmMin: String(wpmMin), wpmMax: String(wpmMax) })
  const data = await apiRequest<{ points: GlobalDataPoint[] }>(`/api/global-data?${query}`)
  return data?.points ?? []
}

export async function savePhase1RunIfSignedIn(record: Phase1RunRecord) {
  await apiRequest('/api/runs/phase1', {
    method: 'POST',
    body: JSON.stringify(record),
    allowUnauthorized: true,
  })
}

export async function recordSimulationActivityIfSignedIn() {
  await apiRequest('/api/activity/simulation-run', {
    method: 'POST',
    allowUnauthorized: true,
  })
}
