export interface ManualTextSegment {
  text: string
  strong?: boolean
  danger?: boolean
}

export interface ManualPage {
  id: string
  paragraphs: ManualTextSegment[][]
  afterDiagramParagraphs?: ManualTextSegment[][]
  diagram?: 'request-response' | 'queue'
}

export const DEFAULT_PLAYER_NAME = 'Player Name'

export function resolvePlayerName(playerName?: string) {
  const trimmedName = playerName?.trim()
  return trimmedName ? trimmedName : DEFAULT_PLAYER_NAME
}

export function createEducationalManualPages(playerName?: string): ManualPage[] {
  const resolvedPlayerName = resolvePlayerName(playerName)

  return [
    {
      id: 'server-origin-and-client-waiting',
      diagram: 'request-response',
      paragraphs: [
        [
          { text: 'In this game, you had the misfortune of being born as a server.' },
        ],
        [
          { text: 'Your current purpose in life is the following: ' },
          { text: 'Clients like ' },
          { text: resolvedPlayerName, strong: true },
          { text: ' and others send you requests. Each request asks you to run a specific task with given details. You run the task and send back a response.' },
        ],
      ],
      afterDiagramParagraphs: [
        [
          { text: 'Your job is to not make your clients mad by taking too long to complete their requests.' },
          { text: '*', danger: true },
        ],
        [
          { text: 'If you take too long, clients may wait, time out, retry, or fail. You would not want ' },
          { text: resolvedPlayerName, strong: true },
          { text: ' and others to go through that trouble.' },
        ],
      ],
    },
    {
      id: 'request-queue-and-response',
      diagram: 'queue',
      paragraphs: [
        [
          { text: 'A server contains a request queue and a worker.' },
        ],
      ],
      afterDiagramParagraphs: [
        [
          { text: 'If the worker is busy, incoming requests wait in the server\'s request queue.' },
        ],
        [
          { text: 'The worker takes the next request from the front of the queue, completes it, and the server sends a response back to the client.' },
        ],
        [
          { text: 'Each slot is one waiting request. The partial slot underneath hints that the queue can keep growing if requests arrive faster than the worker can complete them.' },
        ],
        [
          { text: 'The smaller arrows show the same loop happening for other clients: more requests enter the server, and more responses leave as work completes.' },
        ],
      ],
    },
    {
      id: 'calibration-and-response-time',
      paragraphs: [
        [
          { text: 'Your job as a server is to complete typing tasks for ' },
          { text: resolvedPlayerName, strong: true },
          { text: ' and other clients.' },
        ],
        [
          { text: 'The faster you can complete them, the higher your client satisfaction rate will be.' },
        ],
        [
          { text: 'Your goal is to have the lowest ' },
          { text: 'Response Time (R)', strong: true },
          { text: ' possible.' },
        ],
        [
          { text: 'You will first undergo a calibration process to determine what ' },
          { text: 'level', danger: true },
          { text: ' you are capable of.' },
        ],
      ],
    },
  ]
}
