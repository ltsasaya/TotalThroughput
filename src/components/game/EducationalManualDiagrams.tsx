function ClientComputer({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g aria-hidden="true" transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect className="diagram-device" x="0" y="0" width="80" height="54" rx="4" />
      <rect className="diagram-device-screen" x="8" y="8" width="64" height="36" rx="2" />
      <path className="diagram-device" d="M 27 54 L 53 54 L 60 72 L 20 72 Z" />
      <rect className="diagram-device" x="2" y="78" width="76" height="8" rx="3" />
    </g>
  )
}

export function RequestResponseDiagram({ playerName }: { playerName: string }) {
  return (
    <figure className="retro-manual-diagram" aria-label="Request and response diagram">
      <svg viewBox="0 0 620 360" role="img" aria-labelledby="request-diagram-title request-diagram-desc">
        <title id="request-diagram-title">
          Client computer sends a request to the server and waits for a response
        </title>
        <desc id="request-diagram-desc">
          {playerName} is the client. You are the server. The client sends a
          request, waits while the server handles it, and resumes after the response.
        </desc>
        <defs>
          <marker id="manual-arrow" markerWidth="6" markerHeight="6" refX="5.2" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 z" />
          </marker>
        </defs>

        <text className="diagram-label" x="170" y="37" textAnchor="middle">
          Client (<tspan fontWeight="700">{playerName}</tspan>)
        </text>

        <ClientComputer x={130} y={60} />

        <text className="diagram-label" x="478" y="37" textAnchor="middle">
          Server (<tspan fontWeight="700">You</tspan>)
        </text>

        <g aria-hidden="true">
          <path className="diagram-device" d="M 440 68 L 478 49 L 516 68 L 478 88 Z" />
          <path className="diagram-server-face" d="M 440 68 L 478 88 L 478 150 L 440 130 Z" />
          <path className="diagram-server-side" d="M 478 88 L 516 68 L 516 130 L 478 150 Z" />
          <path className="diagram-server-line" d="M 452 88 L 466 96" />
          <path className="diagram-server-line" d="M 452 107 L 466 115" />
          <circle className="diagram-server-dot" cx="456" cy="126" r="3.5" />
          <path className="diagram-server-line" d="M 492 96 L 506 89" />
          <path className="diagram-server-line" d="M 492 115 L 506 108" />
        </g>

        <line className="diagram-lifeline" x1="170" y1="158" x2="170" y2="344" />
        <line className="diagram-lifeline" x1="478" y1="158" x2="478" y2="344" />

        <line className="diagram-arrow" x1="170" y1="158" x2="170" y2="198" markerEnd="url(#manual-arrow)" />
        <text className="diagram-side-label" x="34" y="172">Send</text>
        <text className="diagram-side-label" x="34" y="190">request</text>

        <line className="diagram-arrow" x1="170" y1="198" x2="478" y2="236" markerEnd="url(#manual-arrow)" />
        <rect className="diagram-label-backdrop" x="257" y="176" width="126" height="24" rx="7" />
        <text className="diagram-path-label" x="320" y="199" textAnchor="middle">Request message</text>

        <text className="diagram-side-label" x="34" y="250">Client waiting</text>
        <text className="diagram-side-label" x="34" y="268">(suspended)</text>
        <text className="diagram-danger-star" x="126" y="268">*</text>

        <text className="diagram-side-label diagram-side-label-right" x="506" y="178">
          Waiting for
        </text>
        <text className="diagram-side-label diagram-side-label-right" x="506" y="196">
          request
        </text>

        <line className="diagram-arrow" x1="478" y1="236" x2="478" y2="276" markerEnd="url(#manual-arrow)" />
        <text className="diagram-side-label diagram-side-label-right" x="506" y="252">
          Work
        </text>
        <text className="diagram-side-label diagram-side-label-right" x="506" y="270">
          executes
        </text>

        <line className="diagram-arrow" x1="478" y1="276" x2="170" y2="315" markerEnd="url(#manual-arrow)" />
        <text className="diagram-path-label" x="320" y="319" textAnchor="middle">Response</text>

        <line className="diagram-arrow" x1="170" y1="315" x2="170" y2="344" markerEnd="url(#manual-arrow)" />
        <text className="diagram-side-label" x="34" y="328">Client resumes</text>
        <text className="diagram-side-label" x="34" y="346">execution</text>

        <text className="diagram-side-label diagram-side-label-right" x="506" y="318">
          Waiting for
        </text>
        <text className="diagram-side-label diagram-side-label-right" x="506" y="336">
          next request
        </text>
      </svg>
    </figure>
  )
}

export function QueueDiagram({ playerName }: { playerName: string }) {
  return (
    <figure className="retro-manual-diagram retro-manual-diagram-queue" aria-label="Server queue and worker diagram">
      <svg viewBox="-20 14 660 278" role="img" aria-labelledby="queue-diagram-title queue-diagram-desc">
        <title id="queue-diagram-title">
          Incoming requests wait in the server queue before a worker handles them
        </title>
        <desc id="queue-diagram-desc">
          {playerName} sends a request into the server. Inside the server, the request
          waits in a queue, moves to a worker when it is ready, and the server
          sends a response back to the client. Other clients can send requests
          and receive responses too.
        </desc>
        <defs>
          <marker id="queue-arrow" markerWidth="6" markerHeight="6" refX="5.2" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 z" />
          </marker>
        </defs>

        <g transform="translate(0 -40)">
          <text className="queue-diagram-small" x="77" y="128" textAnchor="middle">
            Client (<tspan fontWeight="700">{playerName}</tspan>)
          </text>
          <ClientComputer x={52} y={140} scale={0.62} />

          <line className="diagram-arrow queue-diagram-secondary-arrow" x1="30" y1="71" x2="210" y2="103" markerEnd="url(#queue-arrow)" />
          <line className="diagram-arrow queue-diagram-secondary-arrow" x1="46" y1="258" x2="210" y2="231" markerEnd="url(#queue-arrow)" />
          <line className="diagram-arrow queue-diagram-secondary-arrow" x1="540" y1="114" x2="591" y2="87" markerEnd="url(#queue-arrow)" />
          <line className="diagram-arrow queue-diagram-secondary-arrow" x1="540" y1="225" x2="590" y2="257" markerEnd="url(#queue-arrow)" />

          <line className="diagram-arrow" x1="113" y1="172" x2="210" y2="172" markerEnd="url(#queue-arrow)" />

          <rect className="queue-diagram-server-shell" x="210" y="75" width="330" height="184" rx="8" />
          <text className="queue-diagram-label" x="375" y="105" textAnchor="middle">
            Server (<tspan fontWeight="700">You</tspan>)
          </text>

          <rect className="queue-diagram-box" x="224" y="122" width="180" height="120" rx="6" />
          <text className="queue-diagram-label" x="314" y="146" textAnchor="middle">Request Queue</text>
          <rect className="queue-diagram-slot" x="264" y="158" width="100" height="20" rx="3" />
          <text className="queue-diagram-small" x="314" y="173" textAnchor="middle">P1</text>
          <rect className="queue-diagram-slot" x="264" y="183" width="100" height="20" rx="3" />
          <text className="queue-diagram-small" x="314" y="198" textAnchor="middle">P2</text>
          <rect className="queue-diagram-slot" x="264" y="208" width="100" height="20" rx="3" />
          <text className="queue-diagram-small" x="314" y="223" textAnchor="middle">P3</text>
          <rect className="queue-diagram-slot queue-diagram-slot-empty" x="264" y="233" width="100" height="8" rx="3" />

          <line className="diagram-arrow" x1="404" y1="176" x2="426" y2="176" markerEnd="url(#queue-arrow)" />

          <rect className="queue-diagram-box queue-diagram-worker" x="426" y="135" width="100" height="82" rx="6" />
          <text className="queue-diagram-label" x="476" y="169" textAnchor="middle">Worker</text>
          <text className="queue-diagram-small" x="476" y="193" textAnchor="middle">working...</text>

          <path className="diagram-arrow" d="M 540 167 C 615 195 592 305 382 315 C 238 322 188 284 104 184" markerEnd="url(#queue-arrow)" />
          <rect className="diagram-label-backdrop" x="338" y="284" width="78" height="22" rx="6" />
          <text className="queue-diagram-small" x="377" y="300" textAnchor="middle">response</text>
        </g>
      </svg>
    </figure>
  )
}

export function TypingRunPreviewDiagram() {
  return (
    <figure className="retro-manual-diagram retro-manual-diagram-typing-run" aria-label="Typing run preview diagram">
      <svg viewBox="0 0 620 270" role="img" aria-labelledby="typing-run-diagram-title typing-run-diagram-desc">
        <title id="typing-run-diagram-title">
          Placeholder preview of the typing run with a queue, active task, and stats
        </title>
        <desc id="typing-run-diagram-desc">
          A preview of the play screen shows incoming requests waiting in a queue,
          one active typing task, and live stats such as time, WPM, and queue length.
        </desc>
        <defs>
          <marker id="typing-run-arrow" markerWidth="6" markerHeight="6" refX="5.2" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 z" />
          </marker>
        </defs>

        <rect className="queue-diagram-server-shell" x="18" y="18" width="584" height="234" rx="10" />
        <text className="queue-diagram-label" x="310" y="50" textAnchor="middle">Typing Run Preview</text>

        <line className="diagram-arrow queue-diagram-secondary-arrow" x1="0" y1="120" x2="44" y2="120" markerEnd="url(#typing-run-arrow)" />
        <line className="diagram-arrow queue-diagram-secondary-arrow" x1="0" y1="168" x2="44" y2="148" markerEnd="url(#typing-run-arrow)" />
        <text className="queue-diagram-small" x="74" y="76" textAnchor="middle">incoming</text>
        <text className="queue-diagram-small" x="74" y="94" textAnchor="middle">requests</text>

        <rect className="queue-diagram-box" x="44" y="98" width="132" height="112" rx="6" />
        <text className="queue-diagram-label" x="110" y="122" textAnchor="middle">Queue</text>
        <rect className="queue-diagram-slot" x="68" y="136" width="84" height="18" rx="3" />
        <text className="queue-diagram-small" x="110" y="150" textAnchor="middle">P2</text>
        <rect className="queue-diagram-slot" x="68" y="160" width="84" height="18" rx="3" />
        <text className="queue-diagram-small" x="110" y="174" textAnchor="middle">P3</text>
        <rect className="queue-diagram-slot queue-diagram-slot-empty" x="68" y="184" width="84" height="10" rx="3" />

        <line className="diagram-arrow" x1="176" y1="154" x2="210" y2="154" markerEnd="url(#typing-run-arrow)" />

        <rect className="queue-diagram-box" x="210" y="82" width="250" height="144" rx="6" />
        <text className="queue-diagram-label" x="335" y="110" textAnchor="middle">Active Typing Task</text>
        <rect className="queue-diagram-slot" x="232" y="128" width="206" height="48" rx="3" />
        <text className="queue-diagram-small" x="335" y="151" textAnchor="middle">server queue latency</text>
        <line className="diagram-arrow" x1="250" y1="166" x2="330" y2="166" />
        <rect className="queue-diagram-slot-empty" x="232" y="194" width="206" height="12" rx="3" />
        <rect className="diagram-server-dot" x="232" y="194" width="124" height="12" rx="3" />

        <line className="diagram-arrow" x1="460" y1="154" x2="592" y2="154" markerEnd="url(#typing-run-arrow)" />
        <text className="queue-diagram-small" x="526" y="137" textAnchor="middle">response</text>

        <rect className="queue-diagram-box" x="480" y="70" width="96" height="58" rx="6" />
        <text className="queue-diagram-small" x="528" y="92" textAnchor="middle">time</text>
        <text className="queue-diagram-label" x="528" y="116" textAnchor="middle">42s</text>

        <rect className="queue-diagram-box" x="480" y="180" width="96" height="42" rx="6" />
        <text className="queue-diagram-small" x="528" y="198" textAnchor="middle">queue</text>
        <text className="queue-diagram-label" x="528" y="218" textAnchor="middle">3</text>

        <text className="queue-diagram-small" x="92" y="232" textAnchor="middle">waiting work</text>
        <text className="queue-diagram-small" x="334" y="246" textAnchor="middle">typed service work</text>
      </svg>
    </figure>
  )
}
