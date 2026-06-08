export function LearnSection() {
  return (
    <div>
      {/* Section 1: Server as first system */}
      <section className="bg-gray-950 border-t border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <p className="text-xs uppercase tracking-widest text-gray-500">Clients and Servers</p>
          <h2 className="text-2xl font-bold text-white mt-2 mb-4">
            Clients send RPCs to servers
          </h2>
          <p className="text-gray-400 leading-relaxed">
            A client asks a server to do work. That request is an RPC. When too many RPCs
            arrive at once, they wait in the server queue before workers can process them.
          </p>

          <div className="font-mono text-sm border border-gray-700 rounded p-4 mt-6 text-gray-400 inline-block">
            Clients &rarr; RPCs &rarr; [Queue] &rarr; Workers &rarr; Responses
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">RPCs</p>
              <p className="text-gray-400 text-sm">Client requests entering the server.</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Queue</p>
              <p className="text-gray-400 text-sm">Where work waits when every worker is busy.</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Workers</p>
              <p className="text-gray-400 text-sm">Cores, threads, or server processes doing the processing.</p>
            </div>
          </div>

          <p className="text-gray-400 leading-relaxed mt-6">
            This one-server shape is the starting point. CPUs, disks, thread pools, and
            service fleets all reuse the same request, queue, service, response pattern.
          </p>
        </div>
      </section>

      {/* Section 2: What is Server Performance? */}
      <section className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <p className="text-xs uppercase tracking-widest text-gray-500">Server Performance</p>
          <h2 className="text-2xl font-bold text-white mt-2 mb-4">
            How fast can a server respond under load?
          </h2>
          <p className="text-gray-400 leading-relaxed">
            Server performance is about two things: how quickly the server responds to each
            client RPC (response time) and how many requests it can complete per second
            (throughput). These measures show whether the server is fast enough under load.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Response Time</p>
              <p className="text-white font-semibold">R</p>
              <p className="text-gray-400 text-sm mt-1">
                Time from when a client RPC arrives to when the response is complete.
              </p>
            </div>
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Throughput</p>
              <p className="text-white font-semibold">X</p>
              <p className="text-gray-400 text-sm mt-1">
                Number of requests completed per unit of time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Systems generalize the server shape */}
      <section className="bg-gray-950 border-t border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <p className="text-xs uppercase tracking-widest text-gray-500">Systems</p>
          <h2 className="text-2xl font-bold text-white mt-2 mb-4">
            Systems are networks of server-like parts
          </h2>
          <p className="text-gray-400 leading-relaxed">
            A larger system is built from resources that act like small servers: CPUs serve
            runnable work, disks serve I/O, thread pools serve requests, and services call other
            services. RPC fan-out turns one client request into many downstream requests. Each
            part can queue, saturate, and add response time.
          </p>
          <div className="font-mono text-sm border border-gray-700 rounded p-4 mt-6 text-gray-400 inline-block">
            Client &rarr; RPC &rarr; Server &rarr; Dependency RPC &rarr; Response
          </div>
        </div>
      </section>

      {/* Section 4: What Limits a System? */}
      <section className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <p className="text-xs uppercase tracking-widest text-gray-500">Utilization</p>
          <h2 className="text-2xl font-bold text-white mt-2 mb-4">
            As load climbs, response time grows — fast
          </h2>
          <p className="text-gray-400 leading-relaxed">
            Utilization (U) is the fraction of time a server is busy. At low utilization, requests
            flow through quickly. As sustained offered load approaches capacity, queues become
            sensitive to bursts and response time climbs sharply. The simple reference curve is
            nonlinear: doubling load near capacity can multiply response time many times over.
          </p>
          <p className="font-mono text-blue-400 text-lg mt-6">R &asymp; D / (1 &minus; &rho;)</p>

          <div className="mt-6 bg-gray-950 border border-gray-800 rounded-lg p-5">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">What is D?</p>
            <p className="text-gray-400 text-sm leading-relaxed">
              Service demand (D) is how long a request occupies a service center, for example a
              CPU core, on average. For a single serial center, the peak throughput is
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
            For one service center: U = X&nbsp;&middot;&nbsp;D
          </p>
        </div>
      </section>
    </div>
  )
}
