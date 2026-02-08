
import React from 'react';
import { GameState, Player } from '../types';
import { User, Cpu, RotateCcw, Home, ZoomIn, ZoomOut, Trophy, Rotate3d, Hourglass, Globe, Timer, LayoutGrid, Star } from 'lucide-react';

import { soundService } from '../services/soundService';

interface GameUIProps {
  gameState: GameState;
  onReset: () => void;
  onModeToggle: () => void;
  onDifficultyChange: (val: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoomLevel: number;
  onRotate: () => void;
  turnToast: { show: boolean, player: Player | null };
  viewMode: '2D' | '3D';
  onToggleView: () => void;
  earnedStars: number[];
  onStarEarned: (star: number) => void;
}

const GameUI: React.FC<GameUIProps> = ({
  gameState,
  onReset,
  onModeToggle,
  onDifficultyChange,
  onZoomIn,
  onZoomOut,
  zoomLevel,
  onRotate,
  turnToast,
  viewMode,
  onToggleView,
  earnedStars = [],
  onStarEarned
}) => {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isBlackTurn = gameState.turn === 'BLACK';
  const isWhiteTurn = gameState.turn === 'WHITE';
  const activeTime = gameState.timers[gameState.turn];
  const isAiThinking = (gameState.mode === 'PvAI' || gameState.mode === 'Career') && isBlackTurn && !gameState.isGameOver;

  const getOpponentIcon = (size = 18) => {
    if (gameState.mode === 'PvAI' || gameState.mode === 'Career') return <Cpu size={size} strokeWidth={2.5} />;
    if (gameState.mode === 'Online') return <Globe size={size} strokeWidth={2.5} />;
    return <User size={size} strokeWidth={2.5} />;
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex flex-col justify-between p-4 md:p-6">

      {turnToast.show && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 px-6 py-2 bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_0_40px_rgba(0,0,0,0.6)] flex items-center gap-3 animate-in fade-in zoom-in slide-in-from-top-4 duration-300">
          <div className={`w-2 h-2 rounded-full animate-pulse ${turnToast.player === 'WHITE' ? 'bg-white' : 'bg-cyan-500'}`} />
          <span className="text-white font-black uppercase tracking-[0.2em] text-[10px]">
            {turnToast.player === 'WHITE' ? 'Bianco' : 'Nero'}
          </span>
        </div>
      )}

      {/* TOP HUD */}
      <div className="w-full flex justify-between items-center pointer-events-auto gap-2">
        <div className="flex items-center gap-2 bg-slate-950/60 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl">
          <button onClick={onModeToggle} className="p-3 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white" title="Home">
            <Home size={20} />
          </button>
        </div>

        {!gameState.isGameOver && (
          <div className={`flex flex-col items-center gap-2 transition-all duration-500`}>
            {/* Player Info Panel */}
            <div className={`flex items-center gap-4 px-5 py-2 rounded-full glass-panel border-2 shadow-2xl ${isWhiteTurn ? 'border-white/20' : 'border-cyan-500/40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${isWhiteTurn ? 'bg-white text-slate-950' : 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.5)]'}`}>
                {isAiThinking ? <Hourglass size={16} className="animate-spin" /> : (isWhiteTurn ? <User size={16} strokeWidth={3} /> : getOpponentIcon(16))}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Turno</span>
                  <span className={`text-xs font-black uppercase tracking-tighter ${isWhiteTurn ? 'text-white' : 'text-cyan-400'}`}>
                    {isWhiteTurn ? 'Bianco' : 'Nero'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Timer size={12} className={activeTime < 60 ? 'text-red-500' : 'text-slate-500'} />
                  <span className={`text-sm font-mono font-black tabular-nums tracking-tighter ${activeTime < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {formatTime(activeTime)}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Stars Logic */}
            {(gameState.mode === 'PvAI' || gameState.mode === 'Career') && (
              <div className="flex gap-0.5 -mt-8 z-10 px-4 pt-4 pb-1">
                {[1, 2, 3].map(starIndex => {
                  // Calculate capture progress
                  // Standard checkers has 12 pieces per player
                  const blackPieces = gameState.board.flat().filter(p => p?.player === 'BLACK').length;
                  const captured = 12 - blackPieces;
                  const isWin = gameState.winner === 'WHITE';

                  let isActive = false;
                  // Star 1: Nice start (4 captures) or Win
                  if (starIndex === 1 && (captured >= 4 || isWin)) isActive = true;
                  // Star 2: Great play (8 captures) or Win
                  if (starIndex === 2 && (captured >= 8 || isWin)) isActive = true;
                  // Star 3: Victory or Domination (Win)
                  if (starIndex === 3 && isWin) isActive = true;

                  // Trigger sound if just earned (only if onStarEarned is provided and star not yet earned)
                  if (isActive && !earnedStars.includes(starIndex) && onStarEarned) {
                    setTimeout(() => onStarEarned(starIndex), 0);
                  }

                  return (
                    <div key={starIndex} className="relative flex items-center justify-center w-6 h-8">
                      <Star
                        size={isActive ? 20 : 14}
                        strokeWidth={isActive ? 0 : 2}
                        fill={isActive ? "currentColor" : "none"}
                        className={`transition-all duration-700 ${isActive
                          ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse scale-125'
                          : 'text-slate-700 scale-100 opacity-40'
                          }`}
                      />
                      {isActive && (
                        <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-md animate-ping" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 bg-slate-950/60 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl">
          <button onClick={() => { soundService.playSelect(); onReset(); }} className="p-3 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white" title="Reset">
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* Win Screen */}
      {gameState.isGameOver && (
        <div className="self-center p-10 rounded-[3rem] bg-slate-950/95 backdrop-blur-3xl border-2 border-cyan-500/50 shadow-[0_0_60px_rgba(34,211,238,0.3)] text-center pointer-events-auto animate-in fade-in zoom-in duration-500">
          <Trophy className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-bounce" />
          <h2 className="text-4xl font-black mb-1 text-white italic tracking-tighter uppercase">Vittoria!</h2>
          <button onClick={onReset} className="px-10 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-2xl font-black uppercase tracking-widest transition-all transform hover:scale-105 active:scale-95">Nuova Partita</button>
        </div>
      )}

      {/* BOTTOM HUD: Visual controls + Toggle 2D/3D */}
      <div className="w-full flex justify-center pointer-events-auto">
        <div className="flex items-center gap-2 p-2 bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl transition-all">
          <div className="flex bg-slate-900/50 p-1 rounded-full border border-white/5 mr-2">
            <button
              onClick={() => viewMode !== '2D' && onToggleView()}
              className={`p-3 rounded-full transition-all ${viewMode === '2D' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
              title="Visuale 2D"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => viewMode !== '3D' && onToggleView()}
              className={`p-3 rounded-full transition-all ${viewMode === '3D' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
              title="Visuale 3D"
            >
              <Rotate3d size={18} />
            </button>
          </div>

          <button onClick={onZoomOut} className="p-3.5 bg-slate-900/60 rounded-full text-slate-400 hover:text-white transition-all">
            <ZoomOut size={20} />
          </button>

          <button
            onClick={onRotate}
            disabled={viewMode === '2D'}
            className={`p-4 rounded-full transition-all shadow-xl ${viewMode === '2D' ? 'opacity-30 grayscale cursor-not-allowed' : 'bg-slate-800 text-cyan-400 hover:bg-slate-700'}`}
          >
            <Rotate3d size={22} className={viewMode === '3D' ? "animate-pulse" : ""} />
          </button>

          <button onClick={onZoomIn} className="p-3.5 bg-slate-900/60 rounded-full text-slate-400 hover:text-white transition-all">
            <ZoomIn size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameUI;
