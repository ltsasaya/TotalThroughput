export interface UserCalibration {
  wpm: number
  rangeLabel: string
  binIndex: number
  serviceDemandMs: number
  updatedAt: string | null
}

export interface AuthUser {
  id: string
  username: string
  calibration: UserCalibration | null
}

export interface ProfileRun {
  id: string
  completedAt: string
  difficultyLabel: string
  calibrationWpm: number
  calibrationRangeLabel: string | null
  completedCount: number
  arrivalRate: number
  targetLoad: number
  averageResponseTime: number
  averageQueueLength: number
  utilizationPercent: number
}

export interface ProfileClass {
  id: string
  className: string
  instructorName?: string
  classCode?: string
  studentCount: number
}

export interface ProfileData {
  userId: string
  username: string
  summary: {
    runCount: number
    calibrationWpm: number
    calibrationBinIndex: number
    displayBinLabel: string | null
    simulationRunCount: number
    classesJoined: number
    classesTeaching: number
  }
  runs: ProfileRun[]
  studentClasses: ProfileClass[]
  teachingClasses: ProfileClass[]
}

export interface InstructorDashboard {
  instructor: { name: string } | null
  totals: { classCount: number; studentCount: number }
  classes: ProfileClass[]
}

export interface ClassDashboardStudent {
  userId: string
  studentName: string
  studentId: string | null
  runCount: number
  calibrationWpm: number
  simulationRunCount: number
}

export interface ClassDashboard {
  class: {
    id: string
    className: string
    classCode: string
    studentCount: number
  }
  students: ClassDashboardStudent[]
}

export interface JoinClassCheck {
  class: {
    id: string
    className: string
    requiresStudentId: boolean
    requiresStudentName: boolean
  }
}

export interface GlobalDataPoint {
  id: string
  completedAt: string
  difficultyLabel: string
  calibrationWpm: number
  observedTypingWpm: number
  arrivalRate: number
  observedArrivalRate: number
  utilizationPercent: number
  averageQueueLength: number
  averageResponseTime: number
  throughputPerSecond: number
  completedCount: number
}
