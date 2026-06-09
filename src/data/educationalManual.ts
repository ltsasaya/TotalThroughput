export interface ManualTextSegment {
  text: string
  strong?: boolean
  danger?: boolean
  success?: boolean
}

export interface ManualPage {
  id: string
  paragraphs: ManualTextSegment[][]
  afterDiagramParagraphs?: ManualTextSegment[][]
  diagram?: 'request-response' | 'queue' | 'typing-run'
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
          { text: 'Your current purpose in life is the following: COMPLETE REQUESTS. ' },
          { text: 'Clients like ' },
          { text: resolvedPlayerName, strong: true },
          { text: ' and others send you requests they need completed.' },
        ],
      ],
      afterDiagramParagraphs: [
        [
          { text: 'Your job is to not make your clients mad by taking too long to complete their requests.' },
          { text: '*', danger: true },
        ],
        [
          { text: 'If a real server takes too long, clients may wait, time out, retry, or fail.' }
        ],
      ],
    },
    {
      id: 'request-queue-and-response',
      diagram: 'queue',
      paragraphs: [
        [
          { text: 'A server contains a request queue and a worker (or usually multiple workers).' },
        ],
      ],
      afterDiagramParagraphs: [
        [
          { text: 'If the worker is busy, incoming requests wait in the server\'s request queue.' },
        ],
        [
          { text: 'In this case the worker takes the next request from the front of the queue, completes it, and the server sends a response back to the client.' },
        ],
        [
          { text: 'Each slot is one waiting request. Queues can keep growing if requests arrive faster than the worker can complete them.' },
        ],
        [
          { text: 'The same loop happens for other clients too: more requests enter the server, and more responses leave as work completes.' },
        ],
      ],
    },
    {
      id: 'calibration-and-response-time',
      diagram: 'typing-run',
      paragraphs: [
        [
          { text: 'Your task is to complete typing tasks for ' },
          { text: resolvedPlayerName, strong: true },
          { text: ' and other clients.' },
        ],
        [
          { text: 'The faster you can complete them, the higher your client satisfaction rate will be.' },
        ],
        [
          { text: 'Your goal is to have the lowest ' },
          { text: 'Response Time (R)', danger: true },
          { text: ' possible.' },
        ],
        [
          { text: 'The ' },
          { text: 'calibration process', success: true },
          { text: ' will determine what ' },
          { text: 'levels', success: true },
          { text: ' you are capable of.' },
        ],
      ],
    },
  ]
}
