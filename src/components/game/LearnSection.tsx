export function LearnSection() {
  return (
    <div>
      {/* Section 1: What is System Performance? */}
      <section className="bg-gray-950 border-t border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <p className="text-xs uppercase tracking-widest text-gray-500">System Performance</p>
          <h2 className="text-2xl font-bold text-white mt-2 mb-4">
            How fast can a system do useful work?
          </h2>
          <p className="text-gray-400 leading-relaxed">
            System performance is about two things: how quickly the system responds to each request
            (response time) and how many requests it can handle per second (throughput). These two
            measures tell you whether a system is fast enough and productive enough under load.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Response Time</p>
              <p className="text-white font-semibold">R</p>
              <p className="text-gray-400 text-sm mt-1">
                Time from when a request arrives to when the response is complete.
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Throughput</p>
              <p className="text-white font-semibold">X</p>
              <p className="text-gray-400 text-sm mt-1">
                Number of requests completed per unit of time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: What is a System? */}
      <section className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <p className="text-xs uppercase tracking-widest text-gray-500">Systems</p>
          <h2 className="text-2xl font-bold text-white mt-2 mb-4">
            A system turns requests into responses
          </h2>
          <p className="text-gray-400 leading-relaxed">
            Every system has the same basic shape: a client sends a request, the server does work,
            and a response comes back. When the server is busy, incoming requests wait in a queue.
            The system's job is to drain that queue as fast as possible.
          </p>
          <div className="font-mono text-sm border border-gray-700 rounded p-4 mt-6 text-gray-400 inline-block">
            Client &rarr; [Queue] &rarr; Server &rarr; Response
          </div>
        </div>
      </section>

      {/* Section 3: What Limits a System? */}
      <section className="bg-gray-950 border-t border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <p className="text-xs uppercase tracking-widest text-gray-500">Utilization</p>
          <h2 className="text-2xl font-bold text-white mt-2 mb-4">
            As load climbs, response time grows — fast
          </h2>
          <p className="text-gray-400 leading-relaxed">
            Utilization (U) is the fraction of time a server is busy. At low utilization, requests
            flow through quickly. As U approaches 100%, the queue grows without bound and response
            time explodes. The relationship is nonlinear: doubling load near capacity can multiply
            response time many times over.
          </p>
          <p className="font-mono text-blue-400 text-lg mt-6">R = D / (1 &minus; U)</p>

          <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-5">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">What is D?</p>
            <p className="text-gray-400 text-sm leading-relaxed">
              Service demand (D) is how long a request occupies a service center — for example, a
              CPU core — on average. For a single serial center, the peak throughput is
              X&nbsp;=&nbsp;1/D: a server that takes 250&nbsp;ms per request can handle at most
              4&nbsp;requests per second.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed mt-3">
              Real systems are networks of centers (CPU, disk, network) operating in parallel with
              their own internal queues, which makes D harder to measure exactly. Even so, you can
              treat the whole server as a single center and approximate D&nbsp;as&nbsp;1/&lambda;<sub>max</sub>,
              where &lambda;<sub>max</sub> is the peak arrival rate the server can sustain before
              saturating.
            </p>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            U = utilization &nbsp;&middot;&nbsp; X = throughput &nbsp;&middot;&nbsp; Utilization Law: U = XD
          </p>
        </div>
      </section>

      {/* Section 4: Defining a System */}
      <section className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <p className="text-xs uppercase tracking-widest text-gray-500">Defining a System</p>
          <h2 className="text-2xl font-bold text-white mt-2 mb-4">
            What counts as a system?
          </h2>
          <p className="text-gray-400 leading-relaxed">
            A system is any setup that takes in work, processes it, and produces results. Every
            system has three core parts: arrivals (work coming in), one or more workers (the things
            doing the processing), and a queue (where work waits when the workers are busy). The
            behavior you see under load emerges from how these parts interact, not from any one of
            them alone.
          </p>
          <p className="text-gray-400 leading-relaxed mt-4">
            Real-world systems take many forms. A web server is a system: requests arrive, threads
            handle them, and a backlog forms when traffic spikes. A coffee shop is a system:
            customers arrive, baristas serve, and a line builds during the morning rush. A CPU is a
            system: instructions arrive, cores execute, and the run queue holds the rest. The same
            intuition applies to all of them.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Arrivals</p>
              <p className="text-gray-400 text-sm">Work entering the system over time.</p>
            </div>
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Workers</p>
              <p className="text-gray-400 text-sm">The cores, threads, or servers doing the processing.</p>
            </div>
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Queue</p>
              <p className="text-gray-400 text-sm">Where work waits when every worker is busy.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
