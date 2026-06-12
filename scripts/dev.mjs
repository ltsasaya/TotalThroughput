import { spawn } from 'node:child_process'

const children = [
  spawn('npm', ['run', 'dev:api'], { stdio: 'inherit', shell: true }),
  spawn('npm', ['run', 'dev:vite'], { stdio: 'inherit', shell: true }),
]

let shuttingDown = false

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }
  setTimeout(() => process.exit(code), 250)
}

children.forEach(child => {
  child.on('exit', code => {
    shutdown(code ?? 0)
  })
})

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
