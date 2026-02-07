
export type Player = 'WHITE' | 'BLACK';

export enum PieceType {
  NORMAL = 'NORMAL',
  KING = 'KING'
}

export interface Piece {
  id: string;
  player: Player;
  type: PieceType;
  row: number;
  col: number;
}

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  captured?: Position;
}

export interface GameState {
  board: (Piece | null)[][];
  turn: Player;
  selectedPiece: Position | null;
  validMoves: Move[];
  isGameOver: boolean;
  winner: Player | null;
  timers: Record<Player, number>;
  history: Move[];
  mode: 'PvP' | 'PvAI';
  difficulty: number; // 1 to 5
}
