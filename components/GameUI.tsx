
import React from 'react';
import { GameState, Player } from '../types';
import { User, Cpu, RotateCcw, Home, ZoomIn, ZoomOut, Trophy, Rotate3d, Hourglass, Globe, Timer } from 'lucide-react';

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
  turnToast
}) => {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isBlackTurn = gameState.turn === 'BLACK';
  const isWhiteTurn = gameState.turn === 'WHITE';
  const activeTime = gameState.timers[gameState.turn];
  const isAiThinking = gameState.mode === 'PvAI' && isBlackTurn && !gameState.isGameOver;

  const getOpponentIcon = (size = 18) => {
    if (gameState.mode === 'PvAI') return <Cpu size={size} strokeWidth={2.5} />;
    if (gameState.mode === 'Online') return <Globe size={size} strokeWidth={2.5} />;
    return <User size={size} strokeWidth={2.5} />;
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex flex-col justify-between p-4 md:p-6">
      
      {/* Turn Toast Notification (Still useful for immediate feedback) */}
      {turnToast.show && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 px-6 py-2 bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_0_40px_rgba(0,0,0,0.6)] flex items-center gap-3 animate-in fade-in zoom-in slide-in-from-top-4 duration-300">
          <div className={`w-2 h-2 rounded-full animate-pulse ${turnToast.player === 'WHITE' ? 'bg-white' : 'bg-cyan-500'}`} />
          <span className="text-white font-black uppercase tracking-[0.2em] text-[10px]">
            {turnToast.player === 'WHITE' ? 'Bianco' : 'Nero'}
          </span>
        </div>
      )}

      {/* TOP HUD: Integrates Home, Turn Info, and Reset */}
      <div className="w-full flex justify-between items-center pointer-events-auto gap-2">
        <div className="flex items-center gap-2 bg-slate-950/60 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl">
          <button 
            onClick={onModeToggle}
            className="p-3 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
            title="Home"
          >
            <Home size={20} />
          </button>
        </div>

        {/* Central Turn Indicator Pill */}
        {!gameState.isGameOver && (
          <div className={`
            flex items-center gap-4 px-5 py-2 rounded-full glass-panel border-2 transition-all duration-500 shadow-2xl
            ${isWhiteTurn ? 'border-white/20' : 'border-cyan-500/40'}
          `}>
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500
              ${isWhiteTurn ? 'bg-white text-slate-950' : 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.5)]'}
            `}>
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
        )}

        <div className="flex items-center gap-2 bg-slate-950/60 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl">
          {gameState.mode === 'PvAI' && (
            <div className="hidden sm:flex items-center gap-1 mr-2 px-3 py-1 bg-slate-900/40 rounded-lg">
               {[1, 2, 3, 4, 5].map(v => (
                <button 
                  key={v}
                  onClick={() => onDifficultyChange(v)}
                  className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold transition-all ${gameState.difficulty === v ? 'bg-cyan-500 text-slate-950' : 'text-slate-500 hover:text-white'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
          <button 
            onClick={onReset}
            className="p-3 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
            title="Reset"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* Win Screen */}
      {gameState.isGameOver && (
        <div className="self-center p-10 rounded-[3rem] bg-slate-950/95 backdrop-blur-3xl border-2 border-cyan-500/50 shadow-[0_0_60px_rgba(34,211,238,0.3)] text-center pointer-events-auto animate-in fade-in zoom-in duration-500">
          <Trophy className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-bounce" />
          <h2 className="text-4xl font-black mb-1 text-white italic tracking-tighter uppercase">Vittoria!</h2>
          <p className="text-xl text-slate-300 mb-6 font-bold uppercase tracking-widest">
            {gameState.winner === 'WHITE' ? 'Bianchi' : 'Neri'}
          </p>
          <button 
            onClick={onReset}
            className="px-10 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-2xl font-black uppercase tracking-widest transition-all transform hover:scale-105 active:scale-95"
          >
            Nuova Partita
          </button>
        </div>
      )}

      {/* BOTTOM HUD: Controls (Zoom & Rotate) */}
      <div className="w-full flex justify-center pointer-events-auto">
        <div className="flex items-center gap-3 p-2 bg-slate-950/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl transition-all">
          <button 
            onClick={onZoomOut} 
            className="p-4 bg-slate-900/60 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-all" 
            title="Zoom Out"
          >
            <ZoomOut size={22} />
          </button>
          
          <div className="h-8 w-[1px] bg-white/10 mx-1" />
          
          <button 
            onClick={onRotate} 
            className="relative p-5 bg-cyan-500 text-slate-950 rounded-full hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:scale-110 active:scale-90" 
            title="Ruota Scacchiera"
          >
            <Rotate3d size={28} className={gameState.isGameOver ? "" : "animate-pulse"} />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-950 text-[8px] font-black text-white rounded-full border border-white/10">
              3D
            </div>
          </button>

          <div className="h-8 w-[1px] bg-white/10 mx-1" />
          
          <button 
            onClick={onZoomIn} 
            className="p-4 bg-slate-900/60 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-all" 
            title="Zoom In"
          >
            <ZoomIn size={22} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default GameUI;
