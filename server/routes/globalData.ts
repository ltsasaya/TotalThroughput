import { pool } from '../db.js'
import { json, route, type RouteDefinition } from '../http.js'

function readBound(query: URLSearchParams, key: string, fallback: number): number {
  const value = Number(query.get(key))
  return Number.isFinite(value) ? value : fallback
}

export const globalDataRoutes: RouteDefinition[] = [
  route('GET', '/api/global-data', async ({ res, query }) => {
    const wpmMin = Math.max(0, readBound(query, 'wpmMin', 0))
    const wpmMax = Math.min(250, readBound(query, 'wpmMax', 250))
    const result = await pool.query(
      `
        select id, completed_at,
          case difficulty_key
            when 'easy' then 'Easy'
            when 'medium' then 'Medium'
            when 'hard' then 'Hard'
            when 'impossible' then 'Impossible'
            else difficulty_key
          end as difficulty_label,
          calibration_wpm, avg_typing_wpm, arrival_rate, observed_arrival_rate,
          utilization, avg_queue_length, avg_response_ms, throughput_per_second, completed_count
        from typing_runs
        where completed_at is not null
          and coalesce(calibration_wpm, 0) between $1 and $2
        order by completed_at desc
        limit 600
      `,
      [wpmMin, wpmMax],
    )

    json(res, 200, {
      points: result.rows.map(row => ({
        id: row.id,
        completedAt: row.completed_at,
        difficultyLabel: row.difficulty_label,
        calibrationWpm: Number(row.calibration_wpm ?? 0),
        observedTypingWpm: Number(row.avg_typing_wpm ?? 0),
        arrivalRate: Number(row.arrival_rate ?? 0),
        observedArrivalRate: Number(row.observed_arrival_rate ?? 0),
        utilizationPercent: Number(row.utilization ?? 0),
        averageQueueLength: Number(row.avg_queue_length ?? 0),
        averageResponseTime: Number(row.avg_response_ms ?? 0),
        throughputPerSecond: Number(row.throughput_per_second ?? 0),
        completedCount: Number(row.completed_count ?? 0),
      })),
    })
  }),
]
