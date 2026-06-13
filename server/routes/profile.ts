import { pool } from '../db.js'
import { json, requireUser, route, type RouteDefinition } from '../http.js'

function numberValue(value: unknown): number {
  if (value === null || value === undefined) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function runRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    completedAt: String(row.completed_at),
    difficultyLabel: String(row.difficulty_label),
    calibrationWpm: numberValue(row.calibration_wpm),
    calibrationRangeLabel: row.calibration_range_label ? String(row.calibration_range_label) : null,
    completedCount: numberValue(row.completed_count),
    arrivalRate: numberValue(row.arrival_rate),
    targetLoad: numberValue(row.target_load),
    averageResponseTime: numberValue(row.avg_response_ms),
    averageQueueLength: numberValue(row.avg_queue_length),
    utilizationPercent: numberValue(row.utilization),
  }
}

export const profileRoutes: RouteDefinition[] = [
  route('GET', '/api/profile', async ({ res, user }) => {
    const authedUser = requireUser(user)
    const [
      summaryResult,
      runsResult,
      studentClassesResult,
      teachingClassesResult,
    ] = await Promise.all([
      pool.query(
        `
          select
            count(tr.id)::int as run_count,
            coalesce(max(tr.calibration_wpm), 0) as calibration_wpm,
            coalesce(max(tr.calibration_bin_index), 0)::int as calibration_bin_index,
            (
              select tr_latest.calibration_range_label
              from typing_runs tr_latest
              where tr_latest.user_id = $1
              order by tr_latest.completed_at desc
              limit 1
            ) as display_bin_label,
            coalesce(max(ua.simulation_run_count), 0)::int as simulation_run_count,
            (select count(*)::int from class_memberships cm where cm.user_id = $1) as classes_joined,
            (select count(*)::int from classes c where c.instructor_user_id = $1) as classes_teaching
          from users u
          left join typing_runs tr on tr.user_id = u.id
          left join user_activity ua on ua.user_id = u.id
          where u.id = $1
        `,
        [authedUser.id],
      ),
      pool.query(
        `
          select id, completed_at,
            case difficulty_key
              when 'easy' then 'Easy'
              when 'medium' then 'Medium'
              when 'hard' then 'Hard'
              when 'impossible' then 'Impossible'
              else difficulty_key
            end as difficulty_label,
            calibration_wpm, calibration_range_label,
            completed_count, arrival_rate, target_load, avg_response_ms, avg_queue_length, utilization
          from typing_runs
          where user_id = $1
          order by completed_at desc
          limit 30
        `,
        [authedUser.id],
      ),
      pool.query(
        `
          select c.id, c.class_name, ip.instructor_name, count(cm_all.user_id)::int as student_count
          from class_memberships cm
          join classes c on c.id = cm.class_id
          join instructor_profiles ip on ip.user_id = c.instructor_user_id
          left join class_memberships cm_all on cm_all.class_id = c.id
          where cm.user_id = $1
          group by c.id, c.class_name, ip.instructor_name
          order by c.created_at desc
        `,
        [authedUser.id],
      ),
      pool.query(
        `
          select c.id, c.class_name, c.class_code, count(cm.user_id)::int as student_count
          from classes c
          left join class_memberships cm on cm.class_id = c.id
          where c.instructor_user_id = $1
          group by c.id, c.class_name, c.class_code, c.created_at
          order by c.created_at desc
        `,
        [authedUser.id],
      ),
    ])

    const summary = summaryResult.rows[0] ?? {}
    json(res, 200, {
      username: authedUser.username,
      summary: {
        runCount: numberValue(summary.run_count),
        calibrationWpm: numberValue(summary.calibration_wpm),
        calibrationBinIndex: numberValue(summary.calibration_bin_index),
        displayBinLabel: summary.display_bin_label ? String(summary.display_bin_label) : null,
        simulationRunCount: numberValue(summary.simulation_run_count),
        classesJoined: numberValue(summary.classes_joined),
        classesTeaching: numberValue(summary.classes_teaching),
      },
      runs: runsResult.rows.map(runRow),
      studentClasses: studentClassesResult.rows.map(row => ({
        id: row.id,
        className: row.class_name,
        instructorName: row.instructor_name,
        studentCount: row.student_count,
      })),
      teachingClasses: teachingClassesResult.rows.map(row => ({
        id: row.id,
        className: row.class_name,
        classCode: row.class_code,
        studentCount: row.student_count,
      })),
    })
  }),
]
