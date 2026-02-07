
import React, { useRef } from 'react';
import { GameState, Position, Move } from '../types';
import Piece3D from './Piece3D';
import { Target } from 'lucide-react';

interface Board3DProps {
  gameState: GameState;
  onSquareClick: (pos: Position) => void;
  onPieceClick: (pos: Position) => void;
  zoomScale: number;
  boardRotation: number;
  onRotateDrag: (deltaX: number) => void;
  isRotating: boolean;
  setIsRotating: (val: boolean) => void;
}

const Board3D: React.FC<Board3DProps> = ({ 
  gameState, 
  onSquareClick, 
  onPieceClick, 
  zoomScale, 
  boardRotation,
  onRotateDrag,
  isRotating,
  setIsRotating
}) => {
  const { board, selectedPiece, validMoves } = gameState;
  const lastX = useRef(0);
  const dragThreshold = useRef(0);

  const getMoveForSquare = (r: number, c: number): Move | undefined => {
    return validMoves.find(m => m.to.row === r && m.to.col === c);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsRotating(true);
    lastX.current = e.clientX;
    dragThreshold.current = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isRotating) return;
    const deltaX = e.clientX - lastX.current;
    lastX.current = e.clientX;
    dragThreshold.current += Math.abs(deltaX);
    onRotateDrag(deltaX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsRotating(false);
  };

  return (
    <div 
      className="perspective-container flex items-center justify-center w-full min-h-screen pt-12 pb-32 overflow-visible select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div 
        className="transition-transform duration-500 ease-out flex items-center justify-center pointer-events-none"
        style={{ transform: `scale(${zoomScale})`, transformStyle: 'preserve-3d' }}
      >
        <div 
          className={`isometric-board relative grid grid-cols-8 grid-rows-8 bg-slate-900 p-3 rounded-sm shadow-[0_80px_160px_-20px_rgba(0,0,0,0.9)] border-[6px] border-slate-700/60 pointer-events-auto`}
          style={{ 
            transform: `rotateX(55deg) rotateZ(${-45 + boardRotation}deg)`, 
            transformStyle: 'preserve-3d',
            transition: isRotating ? 'none' : 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}
        >
          {/* Strato di illuminazione direzionale */}
          <div className="board-lighting" />
          
          {/* Spessore base della scacchiera */}
          <div 
            className="absolute inset-0 bg-slate-800 rounded-sm"
            style={{ transform: 'translateZ(-20px)' }}
          />

          {Array.from({ length: 8 }).map((_, r) =>
            Array.from({ length: 8 }).map((_, c) => {
              const isDark = (r + c) % 2 !== 0;
              const piece = board[r][c];
              const move = getMoveForSquare(r, c);
              const isSelected = selectedPiece?.row === r && selectedPiece?.col === c;
              const isJump = move?.captured !== undefined;

              return (
                <div 
                  key={`${r}-${c}`}
                  style={{ transformStyle: 'preserve-3d' }}
                  className={`
                    relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center transition-all duration-200
                    ${isDark ? 'bg-slate-600' : 'bg-slate-300'}
                    ${move ? 'cursor-pointer active:brightness-125' : ''}
                  `}
                  onClick={(e) => {
                    if (dragThreshold.current > 5) return;
                    if (isDark) onSquareClick({ row: r, col: c });
                  }}
                >
                  {move && (
                    <div className="absolute inset-0 bg-cyan-400/20 border-2 border-cyan-400/40 z-10" />
                  )}

                  {piece && (
                    <Piece3D 
                      piece={piece} 
                      isSelected={isSelected}
                      onClick={() => {
                        if (dragThreshold.current > 5) return;
                        onPieceClick({ row: r, col: c });
                      }}
                      boardRotation={boardRotation}
                    />
                  )}

                  {move && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
                      style={{ transform: 'translateZ(25px)' }}
                    >
                      {isJump ? (
                        <div className="relative flex items-center justify-center">
                          <Target className="text-red-500 w-10 h-10 animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.9)]" strokeWidth={3} />
                          <div className="absolute inset-0 bg-red-500/40 rounded-full blur-md animate-ping" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-cyan-400 rounded-full shadow-[0_0_20px_rgba(34,211,238,1)] flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Board3D;
