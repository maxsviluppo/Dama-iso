
import { GameState, Piece, Player, PieceType, Position, Move } from '../types';

export const INITIAL_BOARD_SIZE = 8;

export function createInitialBoard(): (Piece | null)[][] {
  const board: (Piece | null)[][] = Array(INITIAL_BOARD_SIZE).fill(null).map(() => Array(INITIAL_BOARD_SIZE).fill(null));

  for (let r = 0; r < INITIAL_BOARD_SIZE; r++) {
    for (let c = 0; c < INITIAL_BOARD_SIZE; c++) {
      // Pieces are only on dark squares (r+c is odd)
      if ((r + c) % 2 !== 0) {
        if (r < 3) {
          board[r][c] = { id: `B-${r}-${c}`, player: 'BLACK', type: PieceType.NORMAL, row: r, col: c };
        } else if (r > 4) {
          board[r][c] = { id: `W-${r}-${c}`, player: 'WHITE', type: PieceType.NORMAL, row: r, col: c };
        }
      }
    }
  }
  return board;
}

export function getValidMoves(board: (Piece | null)[][], row: number, col: number): Move[] {
  const piece = board[row][col];
  if (!piece) return [];

  const moves: Move[] = [];
  const directions = piece.type === PieceType.KING 
    ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] 
    : (piece.player === 'WHITE' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]);

  // Basic moves and jumps
  for (const [dr, dc] of directions) {
    const nr = row + dr;
    const nc = col + dc;

    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      if (!board[nr][nc]) {
        moves.push({ from: { row, col }, to: { row: nr, col: nc } });
      } else if (board[nr][nc]?.player !== piece.player) {
        // Potential jump
        const jr = nr + dr;
        const jc = nc + dc;
        if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && !board[jr][jc]) {
          // Special rule for Italian Dama: pieces cannot jump kings (simplified here for standard)
          moves.push({ from: { row, col }, to: { row: jr, col: jc }, captured: { row: nr, col: nc } });
        }
      }
    }
  }

  // Mandatory jump rule: if any jump is possible, only jumps are valid
  const jumps = moves.filter(m => !!m.captured);
  return jumps.length > 0 ? jumps : moves;
}

export function getAllValidMoves(board: (Piece | null)[][], player: Player): Move[] {
  let allMoves: Move[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.player === player) {
        allMoves = [...allMoves, ...getValidMoves(board, r, c)];
      }
    }
  }
  
  // Mandatory jump rule globally
  const jumps = allMoves.filter(m => !!m.captured);
  return jumps.length > 0 ? jumps : allMoves;
}

export function applyMove(state: GameState, move: Move): GameState {
  const newBoard = state.board.map(row => [...row]);
  const piece = { ...newBoard[move.from.row][move.from.col]! };
  
  piece.row = move.to.row;
  piece.col = move.to.col;
  
  // King promotion
  if (piece.player === 'WHITE' && piece.row === 0) piece.type = PieceType.KING;
  if (piece.player === 'BLACK' && piece.row === 7) piece.type = PieceType.KING;

  newBoard[move.to.row][move.to.col] = piece;
  newBoard[move.from.row][move.from.col] = null;

  if (move.captured) {
    newBoard[move.captured.row][move.captured.col] = null;
  }

  // Check if player can continue jumping
  let nextTurn = state.turn === 'WHITE' ? 'BLACK' : 'WHITE' as Player;
  let nextValidMoves: Move[] = [];

  if (move.captured) {
    const doubleJumps = getValidMoves(newBoard, move.to.row, move.to.col).filter(m => !!m.captured);
    if (doubleJumps.length > 0) {
      nextTurn = state.turn;
      nextValidMoves = doubleJumps;
    }
  }

  // Check for game over
  const opponentMoves = getAllValidMoves(newBoard, nextTurn);
  const isGameOver = opponentMoves.length === 0;

  return {
    ...state,
    board: newBoard,
    turn: nextTurn,
    selectedPiece: nextTurn === state.turn ? { row: move.to.row, col: move.to.col } : null,
    validMoves: nextTurn === state.turn ? nextValidMoves : [],
    isGameOver,
    winner: isGameOver ? state.turn : null,
    history: [...state.history, move]
  };
}
