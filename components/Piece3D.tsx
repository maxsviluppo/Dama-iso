
import React from 'react';
import { Piece, PieceType } from '../types';
import { Crown } from 'lucide-react';

interface Piece3DProps {
  piece: Piece;
  isSelected: boolean;
  onClick: () => void;
  boardRotation: number;
  isFlatView?: boolean;
}

const Piece3D: React.FC<Piece3DProps> = ({ piece, isSelected, onClick, boardRotation, isFlatView = false }) => {
  const isWhite = piece.player === 'WHITE';
  const isKing = piece.type === PieceType.KING;
  
  const baseColor = isWhite ? 'bg-slate-300' : 'bg-slate-950';
  const topColor = isWhite ? 'bg-white' : 'bg-slate-900';
  const ringColor = isKing ? 'border-amber-400' : (isWhite ? 'border-slate-200' : 'border-slate-800');

  const layers = isFlatView ? [0] : Array.from({ length: 6 });

  return (
    <div 
      className={`piece-3d relative w-12 h-12 flex items-center justify-center cursor-pointer ${isSelected ? 'z-50' : 'z-10'} transition-transform duration-500`}
      style={{ 
        transform: isFlatView ? 'none' : `rotateZ(${-boardRotation}deg) ${isSelected ? 'translateZ(45px)' : 'translateZ(0px)'}`,
        transformStyle: isFlatView ? 'flat' : 'preserve-3d'
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <div className="absolute inset-[-12px] rounded-full z-[100]" />

      {/* Shadow layer 1: Contact shadow */}
      {!isSelected && !isFlatView && (
        <div 
          className="absolute inset-1 bg-black/60 rounded-full blur-[2px] pointer-events-none"
          style={{ transform: 'translateZ(-1px) translate(1px, 1px)' }}
        />
      )}

      {/* Shadow layer 2: Projected shadow (disabled in flat view) */}
      {!isFlatView && (
        <div 
          className="absolute inset-0 bg-black/50 rounded-full blur-lg transition-all duration-500 pointer-events-none"
          style={{ 
            transform: `translate3d(${isSelected ? '16px' : '4px'}, ${isSelected ? '16px' : '4px'}, ${isSelected ? '-44px' : '-2px'}) scale(${isSelected ? 1.2 : 1})`,
            opacity: isSelected ? 0.3 : 0.6 
          }}
        />
      )}

      {/* 3D Body layers - Simplified in Flat View */}
      {!isFlatView && layers.map((_, i) => (
        <div
          key={i}
          className={`puck-layer absolute inset-0 ${baseColor} border border-black/10`}
          style={{ transform: `translateZ(${i * 2}px)` }}
        />
      ))}

      {/* Top Surface */}
      <div 
        className={`puck-layer absolute inset-0 rounded-full ${topColor} border-2 ${ringColor} flex items-center justify-center shadow-inner ${isKing ? 'animate-king-glow' : ''} transition-all duration-500`}
        style={{ transform: isFlatView ? 'none' : 'translateZ(12px)' }}
      >
        {isKing && (
          <div className="crown-animation flex items-center justify-center" style={{ transform: isFlatView ? 'none' : 'translateZ(3px)' }}>
             <Crown size={isFlatView ? 24 : 22} className="text-amber-500 fill-amber-500/30" strokeWidth={2.5} />
          </div>
        )}
        
        <div className={`w-8 h-8 rounded-full border border-dashed opacity-20 ${isWhite ? 'border-slate-400' : 'border-slate-100'}`} />
      </div>

      {/* Selection Ring */}
      {isSelected && (
        <div 
          className="absolute -inset-4 rounded-full border-4 border-cyan-400/50 blur-sm animate-pulse"
          style={{ transform: isFlatView ? 'none' : 'translateZ(-1px)' }}
        />
      )}
    </div>
  );
};

export default Piece3D;
