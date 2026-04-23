import { describe, it, expect } from 'vitest'
import { generateTask } from '../content'

describe('generateTask', () => {
  it('returns a task with the correct shape', () => {
    const task = generateTask('S', 0)
    expect(task.id).toBeTruthy()
    expect(task.arrivalTime).toBe(0)
    expect(task.size).toBe('S')
    expect(task.status).toBe('waiting')
    expect(task.typedContent).toBe('')
    expect(typeof task.content).toBe('string')
    expect(task.content!.length).toBeGreaterThan(0)
  })

  it('sets arrivalTime from the provided value', () => {
    const task = generateTask('M', 5000)
    expect(task.arrivalTime).toBe(5000)
  })

  it('sets a deadline beyond the arrival time', () => {
    const task = generateTask('S', 0)
    expect(task.deadline).toBeGreaterThan(0)
  })

  it('generates unique IDs for each task', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateTask('S', 0).id))
    expect(ids.size).toBe(20)
  })

  it('produces non-empty content for each size', () => {
    for (const size of ['S', 'M', 'L'] as const) {
      const task = generateTask(size, 0)
      expect(task.content!.length).toBeGreaterThan(0)
    }
  })

  it('all sizes share the same flat deadline window', () => {
    const s = generateTask('S', 0)
    const m = generateTask('M', 0)
    const l = generateTask('L', 0)
    expect(s.deadline).toBe(l.deadline)
    expect(m.deadline).toBe(l.deadline)
  })
})

describe('word count ranges', () => {
  it('S tasks always have between 2 and 3 words', () => {
    const samples = Array.from({ length: 200 }, () => generateTask('S', 0))
    const wordCounts = samples.map(t => t.content!.split(' ').length)
    expect(Math.min(...wordCounts)).toBeGreaterThanOrEqual(2)
    expect(Math.max(...wordCounts)).toBeLessThanOrEqual(3)
  })

  it('M tasks always have between 3 and 5 words', () => {
    const samples = Array.from({ length: 200 }, () => generateTask('M', 0))
    const wordCounts = samples.map(t => t.content!.split(' ').length)
    expect(Math.min(...wordCounts)).toBeGreaterThanOrEqual(3)
    expect(Math.max(...wordCounts)).toBeLessThanOrEqual(5)
  })

  it('L tasks always have between 5 and 8 words', () => {
    const samples = Array.from({ length: 200 }, () => generateTask('L', 0))
    const wordCounts = samples.map(t => t.content!.split(' ').length)
    expect(Math.min(...wordCounts)).toBeGreaterThanOrEqual(5)
    expect(Math.max(...wordCounts)).toBeLessThanOrEqual(8)
  })
})

describe('deadline values', () => {
  it('S tasks have a deadline exactly 20000ms after arrivalTime', () => {
    const task = generateTask('S', 5000)
    expect(task.deadline).toBe(5000 + 20_000)
  })

  it('M tasks have a deadline exactly 20000ms after arrivalTime', () => {
    const task = generateTask('M', 10000)
    expect(task.deadline).toBe(10000 + 20_000)
  })

  it('L tasks have a deadline exactly 20000ms after arrivalTime', () => {
    const task = generateTask('L', 0)
    expect(task.deadline).toBe(20_000)
  })

  it('deadline equals arrivalTime + 20000ms for every size', () => {
    const cases: Array<['S' | 'M' | 'L', number]> = [
      ['S', 7000],
      ['M', 7000],
      ['L', 7000],
    ]
    for (const [size, arrival] of cases) {
      const task = generateTask(size, arrival)
      expect(task.deadline).toBe(arrival + 20_000)
    }
  })

  it('deadlineMultiplier scales the window', () => {
    const task = generateTask('S', 0, 0, 2.0)
    expect(task.deadline).toBe(40_000)
  })
})
