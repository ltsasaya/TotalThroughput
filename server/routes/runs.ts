import { pool } from '../db.js'
import { json, noContent, readJsonBody, requireUser, route, type RouteDefinition } from '../http.js'
import { parsePhase1RunSummaryBody } from '../runValidation.js'

async function resolveRunClass(userId: string, requestedClassId: string | null): Promise<string | null> {
  if (requestedClassId) {
    const member = await pool.query(
      'select 1 from class_memberships where class_id = $1 and user_id = $2',
      [requestedClassId, userId],
    )
    return member.rowCount ? requestedClassId : null
  }

  const memberships = await pool.query<{ class_id: string }>(
    'select class_id from class_memberships where user_id = $1 limit 2',
    [userId],
  )
  return memberships.rowCount === 1 ? memberships.rows[0].class_id : null
}

function ratePerSecond(count: number, durationMs: number): number {
  return durationMs > 0 ? count / (durationMs / 1000) : 0
}

export const runRoutes: RouteDefinition[] = [
  route('POST', '/api/runs/phase1', async ({ req, res, user }) => {
    const authedUser = requireUser(user)
    const body = parsePhase1RunSummaryBody(await readJsonBody(req))
    const classId = await resolveRunClass(authedUser.id, body.classId)
    const observedArrivalRate = ratePerSecond(body.arrivalCount, body.durationMs)
    const throughputPerSecond = ratePerSecond(body.completedCount, body.durationMs)

    await pool.query(
      `
        insert into typing_runs (
          user_id, class_id, difficulty_key,
          calibration_wpm, calibration_range_label, calibration_bin_index, target_load,
          arrival_rate, observed_arrival_rate, expected_arrivals, arrival_count, completed_count,
          throughput_per_second, avg_response_ms, avg_service_demand_ms,
          avg_typing_wpm, reaction_ms, utilization, avg_queue_length, max_queue_length,
          still_waiting_count, duration_ms, service_demand_estimate_ms, reference_response_ms, seed
        )
        values (
          $1, $2, $3,
          $4, $5, $6, $7,
          $8, $9, $10, $11, $12,
          $13, $14, $15,
          $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25
        )
      `,
      [
        authedUser.id,
        classId,
        body.difficultyKey,
        body.calibrationWpm,
        body.calibrationRangeLabel,
        body.calibrationBinIndex,
        body.targetLoad,
        body.arrivalRate,
        observedArrivalRate,
        body.expectedArrivals,
        body.arrivalCount,
        body.completedCount,
        throughputPerSecond,
        body.averageResponseTime,
        body.averageServiceDemand,
        body.averageTypingSpeed,
        body.reactionSpeed,
        body.utilizationPercent,
        body.averageQueueLength,
        body.maxQueueLength,
        body.stillWaitingCount,
        body.durationMs,
        body.serviceDemandEstimateMs,
        body.referenceResponseTimeMs,
        body.seed,
      ],
    )
    noContent(res)
  }),

  route('POST', '/api/activity/simulation-run', async ({ res, user }) => {
    const authedUser = requireUser(user)
    await pool.query(
      `
        insert into user_activity (user_id, simulation_run_count, last_simulation_run_at, updated_at)
        values ($1, 1, now(), now())
        on conflict (user_id)
        do update set
          simulation_run_count = user_activity.simulation_run_count + 1,
          last_simulation_run_at = now(),
          updated_at = now()
      `,
      [authedUser.id],
    )
    json(res, 200, { ok: true })
  }),
]
