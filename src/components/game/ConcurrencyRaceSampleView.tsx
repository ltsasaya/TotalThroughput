import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { RetroHeader } from './RetroHeader'

type Account = 'A' | 'B'
type VarName = 'x' | 'y' | 'z'
type OpType = 'read' | 'calc' | 'write'
type Accounts = Record<Account, number>
type Vars = Record<VarName, number | null>

interface Op {
  id: string
  txId: string
  label: string
  type: OpType
  account?: Account
  varName: VarName
  delta?: number
}

interface Transaction {
  id: string
  name: string
  ops: Op[]
}

interface TurnLog {
  turn: number
  slots: [SlotLog | null, SlotLog | null]
}

interface SlotLog {
  opId: string
  label: string
  detail: string
}

interface RaceWarning {
  account: Account
  slot1Val: number
  slot2Val: number
}

interface Result {
  success: boolean
  finalAccounts: Accounts
  reason?: string
}

const TRANSACTIONS: Transaction[] = [
  {
    id: 'T1',
    name: 'Deposit 50 into A',
    ops: [
      { id: 'T1_0', txId: 'T1', label: 'read A into x', type: 'read', account: 'A', varName: 'x' },
      { id: 'T1_1', txId: 'T1', label: 'x = x + 50', type: 'calc', varName: 'x', delta: 50 },
      { id: 'T1_2', txId: 'T1', label: 'write x to A', type: 'write', account: 'A', varName: 'x' },
    ],
  },
  {
    id: 'T2',
    name: 'Withdraw 20 from A',
    ops: [
      { id: 'T2_0', txId: 'T2', label: 'read A into y', type: 'read', account: 'A', varName: 'y' },
      { id: 'T2_1', txId: 'T2', label: 'y = y - 20', type: 'calc', varName: 'y', delta: -20 },
      { id: 'T2_2', txId: 'T2', label: 'write y to A', type: 'write', account: 'A', varName: 'y' },
    ],
  },
  {
    id: 'T3',
    name: 'Deposit 10 into B',
    ops: [
      { id: 'T3_0', txId: 'T3', label: 'read B into z', type: 'read', account: 'B', varName: 'z' },
      { id: 'T3_1', txId: 'T3', label: 'z = z + 10', type: 'calc', varName: 'z', delta: 10 },
      { id: 'T3_2', txId: 'T3', label: 'write z to B', type: 'write', account: 'B', varName: 'z' },
    ],
  },
]

const INITIAL_ACCOUNTS: Accounts = { A: 100, B: 50 }
const TARGET_ACCOUNTS: Accounts = { A: 130, B: 60 }
const INITIAL_VARS: Vars = { x: null, y: null, z: null }
const INITIAL_PROGRESS: Record<string, number> = { T1: 0, T2: 0, T3: 0 }

function getOp(opId: string): Op {
  const op = TRANSACTIONS.flatMap(transaction => transaction.ops).find(candidate => candidate.id === opId)
  if (!op) throw new Error(`Operation not found: ${opId}`)
  return op
}

function runOp(op: Op, accounts: Accounts, vars: Vars) {
  if (op.type === 'read') {
    const value = accounts[op.account!]
    return { accounts, vars: { ...vars, [op.varName]: value }, detail: `${op.varName} = ${value}` }
  }
  if (op.type === 'calc') {
    const value = (vars[op.varName] ?? 0) + op.delta!
    return { accounts, vars: { ...vars, [op.varName]: value }, detail: `${op.varName} = ${value}` }
  }
  const value = vars[op.varName] ?? 0
  return {
    accounts: { ...accounts, [op.account!]: value },
    vars,
    detail: `Account ${op.account} = ${value}`,
  }
}

function describeMiss(turns: TurnLog[]) {
  let t1WriteTurn = -1
  let t2ReadTurn = -1
  turns.forEach((turn, turnIndex) => {
    turn.slots.forEach(slot => {
      if (slot?.opId === 'T1_2') t1WriteTurn = turnIndex
      if (slot?.opId === 'T2_0') t2ReadTurn = turnIndex
    })
  })
  if (t2ReadTurn >= 0 && t1WriteTurn >= 0 && t2ReadTurn < t1WriteTurn) {
    return 'T2 read Account A before T1 wrote its update, so it used the older value.'
  }
  return 'The final balance does not match the serial target.'
}

function opState(op: Op, progress: Record<string, number>, slots: [string | null, string | null]) {
  const index = Number(op.id.split('_')[1])
  const done = progress[op.txId] ?? 0
  if (index < done) return 'done'
  if (index > done) return 'waiting'
  if (slots.includes(op.id)) return 'selected'
  return 'available'
}

function OperationButton({
  op,
  state,
  onClick,
}: {
  op: Op
  state: 'available' | 'selected' | 'done' | 'waiting'
  onClick: () => void
}) {
  const stateClass = {
    available: 'border-black bg-white text-black hover:bg-neutral-100',
    selected: 'border-black bg-black text-white',
    done: 'border-neutral-300 bg-white text-neutral-400 line-through',
    waiting: 'border-neutral-300 bg-white text-neutral-400',
  }[state]

  return (
    <button
      type="button"
      className={`w-full border-2 px-2 py-1 text-left text-xs font-bold ${stateClass}`}
      disabled={state === 'done' || state === 'waiting'}
      onClick={onClick}
    >
      <span className="mr-2 text-[0.65rem]">{state === 'done' ? '[done]' : state === 'selected' ? '[slot]' : '[ ]'}</span>
      {op.label}
    </button>
  )
}

export function ConcurrencyRaceSampleView() {
  const goHome = useGameStore(s => s.goHome)
  const [accounts, setAccounts] = useState<Accounts>(INITIAL_ACCOUNTS)
  const [vars, setVars] = useState<Vars>(INITIAL_VARS)
  const [progress, setProgress] = useState<Record<string, number>>(INITIAL_PROGRESS)
  const [slots, setSlots] = useState<[string | null, string | null]>([null, null])
  const [turns, setTurns] = useState<TurnLog[]>([])
  const [raceWarning, setRaceWarning] = useState<RaceWarning | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  const allDone = TRANSACTIONS.every(transaction => progress[transaction.id] === transaction.ops.length)

  const reset = () => {
    setAccounts(INITIAL_ACCOUNTS)
    setVars(INITIAL_VARS)
    setProgress(INITIAL_PROGRESS)
    setSlots([null, null])
    setTurns([])
    setRaceWarning(null)
    setResult(null)
  }

  const toggleOp = (op: Op) => {
    const state = opState(op, progress, slots)
    if (state === 'selected') {
      setSlots(current => current.map(slot => (slot === op.id ? null : slot)) as [string | null, string | null])
      return
    }
    if (state !== 'available') return
    setSlots(current => {
      if (!current[0]) return [op.id, current[1]]
      if (!current[1]) return [current[0], op.id]
      return current
    })
  }

  const executeSlots = () => {
    let nextAccounts = accounts
    let nextVars = vars
    const nextProgress = { ...progress }
    const slotLogs: [SlotLog | null, SlotLog | null] = [null, null]

    slots.forEach((slot, index) => {
      if (!slot) return
      const op = getOp(slot)
      const result = runOp(op, nextAccounts, nextVars)
      nextAccounts = result.accounts
      nextVars = result.vars
      nextProgress[op.txId] = (nextProgress[op.txId] ?? 0) + 1
      slotLogs[index] = { opId: op.id, label: op.label, detail: result.detail }
    })

    const nextTurns = [...turns, { turn: turns.length + 1, slots: slotLogs }]
    setAccounts(nextAccounts)
    setVars(nextVars)
    setProgress(nextProgress)
    setSlots([null, null])
    setTurns(nextTurns)

    const complete = TRANSACTIONS.every(transaction => nextProgress[transaction.id] === transaction.ops.length)
    if (complete) {
      const success = nextAccounts.A === TARGET_ACCOUNTS.A && nextAccounts.B === TARGET_ACCOUNTS.B
      setResult({
        success,
        finalAccounts: nextAccounts,
        reason: success ? undefined : describeMiss(nextTurns),
      })
    }
  }

  const runTurn = () => {
    if ((!slots[0] && !slots[1]) || allDone) return
    const first = slots[0] ? getOp(slots[0]) : null
    const second = slots[1] ? getOp(slots[1]) : null
    if (first?.type === 'write' && second?.type === 'write' && first.account && second.account && first.account === second.account) {
      setRaceWarning({
        account: first.account,
        slot1Val: vars[first.varName] ?? 0,
        slot2Val: vars[second.varName] ?? 0,
      })
      return
    }
    executeSlots()
  }

  return (
    <div className="app-shell min-h-screen bg-white text-black">
      <RetroHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-5 font-mono">
        <section className="border-[3px] border-black bg-white p-5 shadow-[5px_5px_0_#000]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-bold uppercase text-neutral-500">Sample Game Idea</p>
              <h1 className="text-4xl font-bold leading-none">Concurrency Race</h1>
              <p className="mt-3 max-w-3xl text-sm font-bold text-neutral-600">
                Schedule transaction steps into two execution slots. The target is A = 130 and B = 60.
              </p>
            </div>
            <div className="flex gap-3">
              <button type="button" className="border-[3px] border-black bg-white px-4 py-2 font-bold" onClick={goHome}>
                Back
              </button>
              <button type="button" className="border-[3px] border-black bg-black px-4 py-2 font-bold text-white" onClick={reset}>
                Reset
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[12rem_1fr]">
          <aside className="border-[3px] border-black bg-white p-4 shadow-[4px_4px_0_#000]">
            <p className="border-b-2 border-black pb-2 text-xs font-bold uppercase text-neutral-500">Accounts</p>
            {(['A', 'B'] as Account[]).map(account => (
              <div key={account} className="mt-3 border-2 border-black p-3">
                <p className="text-xs font-bold uppercase text-neutral-500">Account {account}</p>
                <p className="text-2xl font-bold">{accounts[account]}</p>
              </div>
            ))}
            <p className="mt-5 border-b-2 border-black pb-2 text-xs font-bold uppercase text-neutral-500">Variables</p>
            {(['x', 'y', 'z'] as VarName[]).map(name => (
              <div key={name} className="mt-2 flex justify-between text-sm font-bold">
                <span className="text-neutral-500">{name}</span>
                <span>{vars[name] ?? '-'}</span>
              </div>
            ))}
          </aside>

          <div className="border-[3px] border-black bg-white shadow-[4px_4px_0_#000]">
            <div className="grid gap-3 border-b-[3px] border-black p-4 md:grid-cols-[1fr_1fr_auto]">
              {([0, 1] as const).map(index => {
                const slot = slots[index]
                return (
                  <button
                    key={index}
                    type="button"
                    className={`min-h-20 border-2 p-3 text-left ${slot ? 'border-black bg-black text-white' : 'border-dashed border-neutral-400 bg-white text-neutral-500'}`}
                    onClick={() => setSlots(current => current.map((value, slotIndex) => (slotIndex === index ? null : value)) as [string | null, string | null])}
                  >
                    <p className="text-xs font-bold uppercase opacity-70">Slot {index + 1}</p>
                    <p className="mt-2 text-sm font-bold">{slot ? `${getOp(slot).txId}: ${getOp(slot).label}` : 'Click an operation'}</p>
                  </button>
                )
              })}
              <button
                type="button"
                className="border-[3px] border-black bg-black px-6 py-3 font-bold uppercase text-white disabled:opacity-40"
                disabled={(!slots[0] && !slots[1]) || allDone}
                onClick={runTurn}
              >
                Run Turn
              </button>
            </div>

            <div className="grid border-b-[3px] border-black md:grid-cols-3">
              {TRANSACTIONS.map(transaction => (
                <div key={transaction.id} className="border-b-2 border-black p-4 md:border-b-0 md:border-r-2">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">{transaction.id}</p>
                      <p className="text-xs font-bold text-neutral-500">{transaction.name}</p>
                    </div>
                    <p className="text-xs font-bold text-neutral-500">{progress[transaction.id]}/3</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {transaction.ops.map(op => (
                      <OperationButton key={op.id} op={op} state={opState(op, progress, slots)} onClick={() => toggleOp(op)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4">
              <p className="border-b-2 border-black pb-2 text-xs font-bold uppercase text-neutral-500">Timeline</p>
              {turns.length === 0 ? (
                <p className="mt-4 border-2 border-neutral-300 p-4 text-center text-sm font-bold text-neutral-500">No turns run yet.</p>
              ) : (
                <div className="mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto">
                  {turns.map(turn => (
                    <div key={turn.turn} className="border-2 border-neutral-300 p-3 text-xs font-bold">
                      <p className="mb-2 uppercase text-neutral-500">Turn {turn.turn}</p>
                      {turn.slots.map((slot, index) => (
                        <p key={index} className="flex flex-wrap justify-between gap-2">
                          <span>Slot {index + 1}: {slot ? `${getOp(slot.opId).txId} ${slot.label}` : 'empty'}</span>
                          <span className="text-neutral-500">{slot?.detail ?? ''}</span>
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {raceWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/85 p-4">
          <div className="w-full max-w-md border-[3px] border-black bg-white p-5 font-mono shadow-[6px_6px_0_#000]">
            <h2 className="border-b-2 border-black pb-2 text-xl font-bold">Write Race Detected</h2>
            <p className="mt-3 text-sm font-bold text-neutral-600">
              Both slots write Account {raceWarning.account}. Slot 2 is applied last if you run this turn.
            </p>
            <div className="mt-4 border-2 border-neutral-300 p-3 text-sm font-bold">
              <p>Slot 1 writes {raceWarning.slot1Val}</p>
              <p>Slot 2 writes {raceWarning.slot2Val}</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button type="button" className="border-2 border-black bg-white px-4 py-2 font-bold" onClick={() => setRaceWarning(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="border-2 border-black bg-black px-4 py-2 font-bold text-white"
                onClick={() => {
                  setRaceWarning(null)
                  executeSlots()
                }}
              >
                Run Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 p-4">
          <div className="w-full max-w-md border-[3px] border-black bg-white p-5 font-mono shadow-[6px_6px_0_#000]">
            <h2 className="border-b-2 border-black pb-2 text-xl font-bold">{result.success ? 'Level Complete' : 'Incorrect Result'}</h2>
            <p className="mt-3 text-sm font-bold text-neutral-600">
              {result.success ? 'Final balances match the target.' : result.reason}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-bold">
              <div className="border-2 border-neutral-300 p-3">
                <p className="text-neutral-500">Expected</p>
                <p>A = {TARGET_ACCOUNTS.A}</p>
                <p>B = {TARGET_ACCOUNTS.B}</p>
              </div>
              <div className="border-2 border-black p-3">
                <p className="text-neutral-500">Your result</p>
                <p>A = {result.finalAccounts.A}</p>
                <p>B = {result.finalAccounts.B}</p>
              </div>
            </div>
            <button type="button" className="mt-4 w-full border-2 border-black bg-black px-4 py-2 font-bold text-white" onClick={reset}>
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
