import { useMemo, useState } from 'react'
import type { CellValue, Mark, MatchOutcome, Winner } from '../../types/game'
import Board from './Board'
import GameControls from './GameControls'

type TicTacToeGameProps = {
  onMatchEnd: (outcome: MatchOutcome) => void
  onBackToMenu: () => void
  onQuit: () => void
}

type GameMode = 'playing' | 'ended'

const PLAYER_MARK: Mark = 'O'
const COMPUTER_MARK: Mark = 'X'
const WIN_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
]

function getWinner(board: CellValue[]): Winner {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a]
    }
  }

  const isBoardFull = board.every((cell) => cell !== null)
  return isBoardFull ? 'draw' : null
}

function getAvailableMoves(board: CellValue[]): number[] {
  return board.flatMap((cell, index) => (cell === null ? [index] : []))
}

function pickComputerMove(board: CellValue[]): number | null {
  const availableMoves = getAvailableMoves(board)
  if (availableMoves.length === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * availableMoves.length)
  return availableMoves[randomIndex]
}

function TicTacToeGame({ onMatchEnd, onBackToMenu, onQuit }: TicTacToeGameProps): React.JSX.Element {
  const [mode, setMode] = useState<GameMode>('playing')
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null))
  const [winner, setWinner] = useState<Winner>(null)

  const titleText = useMemo(() => {
    if (mode === 'ended') {
      if (winner === 'draw') return "It's a Draw!"
      return winner === COMPUTER_MARK ? 'Game Over' : 'You Win!'
    }

    return 'Your Turn (O)'
  }, [mode, winner])

  const resetBoard = (): void => {
    setBoard(Array(9).fill(null))
    setWinner(null)
    setMode('playing')
  }

  const finalizeMatch = (finalBoard: CellValue[], outcome: MatchOutcome): void => {
    setBoard(finalBoard)
    setWinner(outcome)
    setMode('ended')
    onMatchEnd(outcome)
  }

  const handlePlayerMove = (index: number): void => {
    if (mode !== 'playing' || board[index] !== null) {
      return
    }

    const boardAfterPlayerMove = [...board]
    boardAfterPlayerMove[index] = PLAYER_MARK

    const playerResult = getWinner(boardAfterPlayerMove)
    if (playerResult !== null) {
      finalizeMatch(boardAfterPlayerMove, playerResult)
      return
    }

    const computerMove = pickComputerMove(boardAfterPlayerMove)
    if (computerMove === null) {
      finalizeMatch(boardAfterPlayerMove, 'draw')
      return
    }

    const boardAfterComputerMove = [...boardAfterPlayerMove]
    boardAfterComputerMove[computerMove] = COMPUTER_MARK

    const computerResult = getWinner(boardAfterComputerMove)
    if (computerResult !== null) {
      finalizeMatch(boardAfterComputerMove, computerResult)
      return
    }

    setBoard(boardAfterComputerMove)
  }

  return (
    <section className="game-panel" aria-label="Tic-tac-toe game">
      <h1 className="title">{titleText}</h1>
      <div className="board-wrapper">
        <Board board={board} disabled={mode !== 'playing'} onSelectCell={handlePlayerMove} />
        {mode === 'ended' && (
          <GameControls onReset={resetBoard} onBackToMenu={onBackToMenu} onQuit={onQuit} />
        )}
      </div>
    </section>
  )
}

export default TicTacToeGame
