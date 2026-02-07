
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

export interface CareerLevel {
  id: number;
  title: string;
  difficulty: number; // 1-5
  requiredStars: number;
  basePoints: number;
}

export interface LevelResult {
  levelId: number;
  stars: number;
  score: number;
  completedAt: number;
}

export interface UserProgress {
  totalScore: number;
  totalStars: number;
  results: Record<number, LevelResult>;
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
  mode: 'PvP' | 'PvAI' | 'Online' | 'Career';
  difficulty: number;
  currentLevelId?: number;
}
