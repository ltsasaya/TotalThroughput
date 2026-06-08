import { FormulaCallout, Panel, SectionLabel } from '@/components/ui/primitives'

export function LearnSection() {
  const flow = [
    ['01', 'Client', 'Sends an RPC.'],
    ['02', 'Queue', 'Waits if every worker is busy.'],
    ['03', 'Worker', 'Spends service demand D.'],
    ['04', 'Response', 'Returns after waiting plus service.'],
  ]

  return (
    <div>
      <section className="app-band">
        <div className="mx-auto max-w-4xl px-5 py-16 md:px-8">
          <SectionLabel>Clients and servers</SectionLabel>
          <h2 className="mt-2 text-2xl font-bold">Clients send RPCs to servers</h2>
          <p className="tt-copy mt-4">
            A client asks a server to do work. That request is an RPC. When too many RPCs
            arrive at once, they wait in the server queue before workers can process them.
          </p>

          <div className="mt-7 grid gap-2 md:grid-cols-4">
            {flow.map(([number, label, copy]) => (
              <div key={label} className="rounded-lg border border-[color:var(--tt-border)] bg-[color:var(--tt-surface)] p-4">
                <div className="tt-muted font-mono text-xs">{number}</div>
                <div className="mt-2 font-semibold text-[color:var(--tt-text)]">{label}</div>
                <p className="tt-copy mt-1 text-xs">{copy}</p>
              </div>
            ))}
          </div>

          <FormulaCallout
            className="mt-6"
            formula="Client -> RPC -> Queue -> Worker -> Response"
            caption="The same shape appears in CPUs, disks, thread pools, and services."
          />
        </div>
      </section>

      <section className="bg-[color:var(--tt-bg)]">
        <div className="mx-auto max-w-3xl px-5 py-16 md:px-8">
          <SectionLabel>Server performance</SectionLabel>
          <h2 className="mt-2 text-2xl font-bold">How fast can a server respond under load?</h2>
          <p className="tt-copy mt-4">
            Server performance is about response time and throughput. These measures show
            whether the server is fast enough under the current arrival rate.
          </p>
          <div className="mt-6 rounded-lg border border-[color:var(--tt-border)]">
            <div className="grid gap-4 p-4 md:grid-cols-[90px_minmax(0,1fr)]">
              <div className="font-mono text-lg font-bold text-[color:var(--tt-text)]">R</div>
              <p className="tt-copy text-sm">
                Response time is the time from when a client RPC arrives to when the response is complete.
              </p>
            </div>
            <div className="tt-divider" />
            <div className="grid gap-4 p-4 md:grid-cols-[90px_minmax(0,1fr)]">
              <div className="font-mono text-lg font-bold text-[color:var(--tt-text)]">X</div>
              <p className="tt-copy text-sm">
                Throughput is the number of requests completed per unit of time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="app-band">
        <div className="mx-auto max-w-3xl px-5 py-16 md:px-8">
          <SectionLabel>Systems</SectionLabel>
          <h2 className="mt-2 text-2xl font-bold">Systems are networks of server-like parts</h2>
          <p className="tt-copy mt-4">
            A larger system is built from resources that act like small servers: CPUs serve
            runnable work, disks serve I/O, thread pools serve requests, and services call
            other services. Each part can queue, saturate, and add response time.
          </p>
          <FormulaCallout
            className="mt-6 inline-block"
            formula="Client -> RPC -> Server -> Dependency RPC -> Response"
            caption="Fan-out repeats the request, queue, service, response pattern."
          />
        </div>
      </section>

      <section className="bg-[color:var(--tt-bg)]">
        <div className="mx-auto max-w-3xl px-5 py-16 md:px-8">
          <SectionLabel>Utilization</SectionLabel>
          <h2 className="mt-2 text-2xl font-bold">As load climbs, response time grows fast</h2>
          <p className="tt-copy mt-4">
            Utilization is the fraction of time a server is busy. At low utilization, requests
            flow through quickly. As sustained offered load approaches capacity, queues become
            sensitive to bursts and response time climbs sharply.
          </p>

          <FormulaCallout
            className="mt-6"
            formula="R ~= D / (1 - rho)"
            caption="Simple stable M/M/1 reference intuition, not an exact finite-run result."
          />

          <Panel className="mt-6 p-5">
            <SectionLabel>What is D?</SectionLabel>
            <p className="tt-copy mt-3 text-sm">
              Service demand is how long a request occupies a service center on average. For
              one serial center, peak throughput is roughly 1/D.
            </p>
            <p className="tt-copy mt-3 text-sm">
              Real systems are networks of centers, so D is harder to measure exactly. The game
              starts with the whole server as one service center and reports finite-run observations.
            </p>
          </Panel>
        </div>
      </section>
    </div>
  )
}
