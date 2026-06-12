import { pool, withTransaction } from '../db'
import { createClassCode } from '../crypto'
import { HttpError, json, noContent, readJsonBody, requireUser, route, type RouteDefinition } from '../http'
import { asObject, booleanField, optionalStringField, stringField, uuidValue } from '../validation'

function num(value: unknown): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

async function ensureInstructorOwnsClass(classId: string, userId: string) {
  const result = await pool.query(
    'select 1 from classes where id = $1 and instructor_user_id = $2',
    [classId, userId],
  )
  if (!result.rowCount) throw new HttpError(404, 'Class not found.')
}

async function findClassByCode(classCode: string) {
  const result = await pool.query<{
    id: string
    class_name: string
    requires_student_id: boolean
    requires_student_name: boolean
  }>(
    `
      select id, class_name, requires_student_id, requires_student_name
      from classes
      where class_code = $1
    `,
    [classCode.trim().toUpperCase()],
  )
  const foundClass = result.rows[0]
  if (!foundClass) throw new HttpError(404, 'Class code is incorrect.')
  return foundClass
}

export const classRoutes: RouteDefinition[] = [
  route('GET', '/api/instructor/dashboard', async ({ res, user }) => {
    const authedUser = requireUser(user)
    const profile = await pool.query<{ instructor_name: string }>(
      'select instructor_name from instructor_profiles where user_id = $1',
      [authedUser.id],
    )
    if (!profile.rowCount) {
      json(res, 200, { instructor: null, classes: [], totals: { classCount: 0, studentCount: 0 } })
      return
    }

    const classes = await pool.query(
      `
        select c.id, c.class_name, c.class_code, count(cm.user_id)::int as student_count
        from classes c
        left join class_memberships cm on cm.class_id = c.id
        where c.instructor_user_id = $1
        group by c.id, c.class_name, c.class_code, c.created_at
        order by c.created_at desc
      `,
      [authedUser.id],
    )
    const studentTotal = classes.rows.reduce((total, row) => total + num(row.student_count), 0)
    json(res, 200, {
      instructor: { name: profile.rows[0].instructor_name },
      totals: { classCount: classes.rowCount, studentCount: studentTotal },
      classes: classes.rows.map(row => ({
        id: row.id,
        className: row.class_name,
        classCode: row.class_code,
        studentCount: row.student_count,
      })),
    })
  }),

  route('POST', '/api/instructor/profile', async ({ req, res, user }) => {
    const authedUser = requireUser(user)
    const body = asObject(await readJsonBody(req))
    const instructorName = stringField(body, 'instructorName', { min: 1, max: 80 })
    await pool.query(
      `
        insert into instructor_profiles (user_id, instructor_name)
        values ($1, $2)
        on conflict (user_id)
        do update set instructor_name = excluded.instructor_name, updated_at = now()
      `,
      [authedUser.id, instructorName],
    )
    json(res, 200, { instructor: { name: instructorName } })
  }),

  route('POST', '/api/classes', async ({ req, res, user }) => {
    const authedUser = requireUser(user)
    const body = asObject(await readJsonBody(req))
    const className = stringField(body, 'className', { min: 1, max: 100 })
    const requiresStudentId = booleanField(body, 'requiresStudentId')
    const requiresStudentName = booleanField(body, 'requiresStudentName')

    const created = await withTransaction(async (client) => {
      const instructor = await client.query('select 1 from instructor_profiles where user_id = $1', [authedUser.id])
      if (!instructor.rowCount) throw new HttpError(400, 'Instructor name is required first.')

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const classCode = createClassCode()
        const result = await client.query(
          `
            insert into classes (
              instructor_user_id, class_code, class_name,
              requires_student_id, requires_student_name
            )
            values ($1, $2, $3, $4, $5)
            on conflict (class_code) do nothing
            returning id, class_name, class_code
          `,
          [authedUser.id, classCode, className, requiresStudentId, requiresStudentName],
        )
        if (result.rowCount) return result.rows[0]
      }
      throw new HttpError(500, 'Could not create a class code.')
    })

    json(res, 201, {
      class: {
        id: created.id,
        className: created.class_name,
        classCode: created.class_code,
        studentCount: 0,
      },
    })
  }),

  route('POST', '/api/classes/check', async ({ req, res, user }) => {
    requireUser(user)
    const body = asObject(await readJsonBody(req))
    const classCode = stringField(body, 'classCode', { min: 4, max: 20 })
    const foundClass = await findClassByCode(classCode)
    json(res, 200, {
      class: {
        id: foundClass.id,
        className: foundClass.class_name,
        requiresStudentId: foundClass.requires_student_id,
        requiresStudentName: foundClass.requires_student_name,
      },
    })
  }),

  route('POST', '/api/classes/join', async ({ req, res, user }) => {
    const authedUser = requireUser(user)
    const body = asObject(await readJsonBody(req))
    const classCode = stringField(body, 'classCode', { min: 4, max: 20 })
    const foundClass = await findClassByCode(classCode)
    const studentName = optionalStringField(body, 'studentName', 80)
    const studentId = optionalStringField(body, 'studentId', 80)

    if (foundClass.requires_student_name && !studentName) throw new HttpError(400, 'Student name is required.')
    if (foundClass.requires_student_id && !studentId) throw new HttpError(400, 'Student ID is required.')

    const joined = await pool.query(
      `
        insert into class_memberships (class_id, user_id, student_name, student_id)
        values ($1, $2, $3, $4)
        on conflict (class_id, user_id) do nothing
      `,
      [foundClass.id, authedUser.id, studentName, studentId],
    )

    if (!joined.rowCount) {
      json(res, 409, { message: 'You are already enrolled.' })
      return
    }
    json(res, 201, { class: { id: foundClass.id, className: foundClass.class_name } })
  }),

  route('GET', '/api/classes/:classId/dashboard', async ({ res, user, params }) => {
    const authedUser = requireUser(user)
    const classId = uuidValue(params.classId, 'classId')
    await ensureInstructorOwnsClass(classId, authedUser.id)

    const classResult = await pool.query(
      'select id, class_name, class_code from classes where id = $1',
      [classId],
    )
    const students = await pool.query(
      `
        select
          u.id as user_id,
          coalesce(cm.student_name, 'Anon') as student_name,
          cm.student_id,
          count(tr.id)::int as run_count,
          coalesce(max(tr.calibration_wpm), 0) as calibration_wpm,
          coalesce(max(ua.simulation_run_count), 0)::int as simulation_run_count
        from class_memberships cm
        join users u on u.id = cm.user_id
        left join typing_runs tr on tr.user_id = u.id and tr.class_id = cm.class_id
        left join user_activity ua on ua.user_id = u.id
        where cm.class_id = $1
        group by u.id, cm.student_name, cm.student_id
        order by lower(coalesce(cm.student_name, u.username)), u.username
      `,
      [classId],
    )
    const classRow = classResult.rows[0]
    json(res, 200, {
      class: {
        id: classRow.id,
        className: classRow.class_name,
        classCode: classRow.class_code,
        studentCount: students.rowCount,
      },
      students: students.rows.map(row => ({
        userId: row.user_id,
        studentName: row.student_name,
        studentId: row.student_id,
        runCount: row.run_count,
        calibrationWpm: Number(row.calibration_wpm ?? 0),
        simulationRunCount: row.simulation_run_count,
      })),
    })
  }),

  route('DELETE', '/api/classes/:classId/students/:studentUserId', async ({ res, user, params }) => {
    const authedUser = requireUser(user)
    const classId = uuidValue(params.classId, 'classId')
    const studentUserId = uuidValue(params.studentUserId, 'studentUserId')
    await ensureInstructorOwnsClass(classId, authedUser.id)
    await pool.query(
      'delete from class_memberships where class_id = $1 and user_id = $2',
      [classId, studentUserId],
    )
    noContent(res)
  }),

  route('GET', '/api/classes/:classId/students/:studentUserId/profile', async ({ res, user, params }) => {
    const authedUser = requireUser(user)
    const classId = uuidValue(params.classId, 'classId')
    const studentUserId = uuidValue(params.studentUserId, 'studentUserId')
    await ensureInstructorOwnsClass(classId, authedUser.id)
    const result = await pool.query(
      `
        select tr.id, tr.completed_at,
          case tr.difficulty_key
            when 'easy' then 'Easy'
            when 'medium' then 'Medium'
            when 'hard' then 'Hard'
            when 'impossible' then 'Impossible'
            else tr.difficulty_key
          end as difficulty_label,
          tr.completed_count,
          tr.calibration_wpm, tr.avg_response_ms, tr.avg_queue_length, tr.utilization
        from typing_runs tr
        where tr.class_id = $1 and tr.user_id = $2
        order by tr.completed_at desc
        limit 20
      `,
      [classId, studentUserId],
    )
    json(res, 200, {
      runs: result.rows.map(row => ({
        id: row.id,
        completedAt: row.completed_at,
        difficultyLabel: row.difficulty_label,
        completedCount: row.completed_count,
        calibrationWpm: Number(row.calibration_wpm ?? 0),
        averageResponseTime: Number(row.avg_response_ms ?? 0),
        averageQueueLength: Number(row.avg_queue_length ?? 0),
        utilizationPercent: Number(row.utilization ?? 0),
      })),
    })
  }),
]
