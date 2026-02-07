
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
  viewMode: '2D' | '3D';
}

const Board3D: React.FC<Board3DProps> = ({ 
  gameState, 
  onSquareClick, 
  onPieceClick, 
  zoomScale, 
  boardRotation,
  onRotateDrag,
  isRotating,
  setIsRotating,
  viewMode
}) => {
  const { board, selectedPiece, validMoves } = gameState;
  const lastX = useRef(0);
  const dragThreshold = useRef(0);
  const is3D = viewMode === '3D';

  const getMoveForSquare = (r: number, c: number): Move | undefined => {
    return validMoves.find(m => m.to.row === r && m.to.col === c);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // In 2D non ruotiamo, ma resettiamo il threshold per il click
    lastX.current = e.clientX;
    dragThreshold.current = 0;
    
    if (!is3D) return;
    
    setIsRotating(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const deltaX = e.clientX - lastX.current;
    lastX.current = e.clientX;
    dragThreshold.current += Math.abs(deltaX);

    if (!isRotating || !is3D) return;
    
    // Feedback ultra-rapido e diretto
    onRotateDrag(deltaX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsRotating(false);
  };

  const rotationX = is3D ? 55 : 0;
  const rotationZ = is3D ? (-45 + boardRotation) : 0;
  const perspective = is3D ? "2500px" : "none";

  return (
    <div 
      className="perspective-container flex items-center justify-center w-full min-h-screen pt-12 pb-32 overflow-visible select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ perspective }}
    >
      <div 
        className="flex items-center justify-center"
        style={{ 
          transform: `scale(${zoomScale})`, 
          transformStyle: is3D ? 'preserve-3d' : 'flat',
          transition: isRotating ? 'none' : 'transform 0.5s cubic-bezier(0.2, 0, 0.2, 1)'
        }}
      >
        <div 
          className={`relative grid grid-cols-8 grid-rows-8 bg-slate-900 p-3 rounded-sm shadow-[0_40px_100px_rgba(0,0,0,0.6)] border-[6px] border-slate-700/60`}
          style={{ 
            transform: `rotateX(${rotationX}deg) rotateZ(${rotationZ}deg)`, 
            transformStyle: is3D ? 'preserve-3d' : 'flat',
            transition: isRotating ? 'none' : 'transform 0.5s cubic-bezier(0.2, 0, 0.2, 1)'
          }}
        >
          {is3D && <div className="board-lighting" />}
          
          {/* Spessore della scacchiera */}
          <div 
            className="absolute inset-0 bg-slate-800 rounded-sm"
            style={{ 
              transform: 'translateZ(-20px)', 
              display: is3D ? 'block' : 'none'
            }}
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
                  style={{ transformStyle: is3D ? 'preserve-3d' : 'flat' }}
                  className={`
                    relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center
                    ${isDark ? 'bg-slate-800/80' : 'bg-slate-300'}
                    ${move ? 'cursor-pointer' : ''}
                  `}
                  onClick={(e) => {
                    // Se abbiamo trascinato vistosamente, ignoriamo il click
                    if (dragThreshold.current > 10) return;
                    if (isDark) onSquareClick({ row: r, col: c });
                  }}
                >
                  {move && (
                    <div className="absolute inset-0 bg-cyan-400/30 border-2 border-cyan-400/50 z-10" />
                  )}

                  {piece && (
                    <Piece3D 
                      piece={piece} 
                      isSelected={isSelected}
                      onClick={() => {
                        if (dragThreshold.current > 10) return;
                        onPieceClick({ row: r, col: c });
                      }}
                      boardRotation={is3D ? boardRotation : 0}
                      isFlatView={!is3D}
                    />
                  )}

                  {move && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
                      style={{ 
                        transform: is3D ? 'translateZ(25px)' : 'none'
                      }}
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
