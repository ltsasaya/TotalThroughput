export interface ManualTextSegment {
  text: string
  strong?: boolean
  danger?: boolean
}

export interface ManualPage {
  id: string
  paragraphs: ManualTextSegment[][]
  afterDiagramParagraphs?: ManualTextSegment[][]
  diagram?: 'rpc'
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
      diagram: 'rpc',
      paragraphs: [
        [
          { text: 'In this game, you had the misfortune of being born as a server.' },
        ],
        [
          { text: 'Your current purpose in life is the following: ' },
          { text: 'Clients like ' },
          { text: resolvedPlayerName, strong: true },
          { text: ' and others send you requests as Remote Procedure Calls, or RPCs. Each RPC request asks you to run a specific procedure with given parameters. You run the procedure and send back a response.' },
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
  ]
}
