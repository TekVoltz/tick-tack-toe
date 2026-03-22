import type { CellValue } from '../../types/game'

type BoardProps = {
  board: CellValue[]
  disabled: boolean
  onSelectCell: (index: number) => void
}

function Board({ board, disabled, onSelectCell }: BoardProps): React.JSX.Element {
  return (
    <div className="board" role="grid" aria-label="Tic-tac-toe board">
      {board.map((cell, index) => (
        <button
          key={index}
          className="cell"
          onClick={() => onSelectCell(index)}
          type="button"
          disabled={disabled || cell !== null}
          aria-label={`Cell ${index + 1}`}
        >
          {cell}
        </button>
      ))}
    </div>
  )
}

export default Board
