export type Mark = 'O' | 'X'
export type CellValue = Mark | null
export type Winner = Mark | 'draw' | null

export type MatchOutcome = Exclude<Winner, null>

export type MatchRecord = {
  id: number
  outcome: MatchOutcome
  playedAt: string
}
