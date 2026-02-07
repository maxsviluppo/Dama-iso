
import React from 'react';
import { GameState, Player } from '../types';
import { User, Cpu, RotateCcw, Home, ZoomIn, ZoomOut, Trophy, Rotate3d, Hourglass } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex flex-col justify-between p-4 md:p-8">
      {/* Turn Toast Notification */}
      {turnToast.show && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 px-8 py-3 bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_0_40px_rgba(0,0,0,0.6)] flex items-center gap-3 animate-in fade-in zoom-in slide-in-from-top-4 duration-300">
          <div className={`w-3 h-3 rounded-full animate-pulse ${turnToast.player === 'WHITE' ? 'bg-white shadow-[0_0_10px_white]' : 'bg-cyan-500 shadow-[0_0_10px_#22d3ee]'}`} />
          <span className="text-white font-black uppercase tracking-[0.2em] text-xs">
            Turno: {turnToast.player === 'WHITE' ? 'Bianco' : 'Nero'}
          </span>
        </div>
      )}

      {/* Top Header Section */}
      <div className="w-full flex justify-between items-center pointer-events-auto bg-slate-900/40 backdrop-blur-xl border border-white/5 p-3 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={onModeToggle}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
            title="Home"
          >
            <Home size={22} />
          </button>
          <div className="h-6 w-[1px] bg-white/10" />
          <h1 className="text-xl font-black text-white tracking-tighter hidden sm:block">
            DAMA <span className="text-cyan-400">3D</span>
          </h1>
        </div>

        {/* Global Stats or Diff if AI mode */}
        {gameState.mode === 'PvAI' && (
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-slate-950/40 rounded-xl border border-white/5">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Difficoltà:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(v => (
                <button 
                  key={v}
                  onClick={() => onDifficultyChange(v)}
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${gameState.difficulty === v ? 'bg-cyan-500 text-slate-950 scale-110 shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
           <button 
            onClick={onReset}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
            title="Reset Game"
          >
            <RotateCcw size={22} />
          </button>
        </div>
      </div>

      {/* Center - Win Screen */}
      {gameState.isGameOver && (
        <div className="self-center p-12 rounded-[3rem] bg-slate-950/90 backdrop-blur-3xl border-2 border-cyan-500/50 shadow-[0_0_50px_rgba(34,211,238,0.4)] text-center pointer-events-auto animate-in fade-in zoom-in duration-500">
          <Trophy className="w-20 h-20 text-cyan-400 mx-auto mb-6 animate-bounce" />
          <h2 className="text-5xl font-black mb-2 text-white italic tracking-tighter uppercase">Vittoria!</h2>
          <p className="text-2xl text-slate-300 mb-8 font-bold">
            I <span className={gameState.winner === 'WHITE' ? 'text-white' : 'text-cyan-400'}>{gameState.winner === 'WHITE' ? 'BIANCHI' : 'NERI'}</span> Trionfano
          </p>
          <button 
            onClick={onReset}
            className="px-12 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-2xl font-black uppercase tracking-widest transition-all transform hover:scale-105 active:scale-95 shadow-lg"
          >
            Nuova Partita
          </button>
        </div>
      )}

      {/* Floating Side Controls */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-auto">
        <button onClick={onZoomIn} className="p-3 bg-slate-900/60 backdrop-blur border border-white/10 rounded-2xl text-white hover:bg-cyan-500/20 transition-all shadow-xl" title="Zoom In">
          <ZoomIn size={24} />
        </button>
        <button onClick={onZoomOut} className="p-3 bg-slate-900/60 backdrop-blur border border-white/10 rounded-2xl text-white hover:bg-cyan-500/20 transition-all shadow-xl" title="Zoom Out">
          <ZoomOut size={24} />
        </button>
        <div className="h-[1px] bg-white/10 my-1" />
        <button onClick={onRotate} className="p-3 bg-slate-950/80 backdrop-blur border border-cyan-500/30 rounded-2xl text-cyan-400 hover:text-white hover:bg-cyan-500/40 transition-all shadow-2xl" title="Ruota Scacchiera">
          <Rotate3d size={24} className={gameState.isGameOver ? "" : "animate-pulse"} />
        </button>
      </div>

      {/* Simplified Bottom Active Player HUD */}
      <div className="w-full flex justify-center pointer-events-auto">
        {!gameState.isGameOver && (
          <div className={`
            relative group flex items-center gap-6 p-1.5 pl-6 rounded-full bg-slate-950/80 backdrop-blur-3xl border-2 transition-all duration-500 shadow-2xl
            ${isWhiteTurn ? 'border-white/20' : 'border-cyan-500/30'}
          `}>
            {/* Active Turn Glow */}
            <div className={`absolute -inset-1 rounded-full blur-xl opacity-20 animate-pulse ${isWhiteTurn ? 'bg-white' : 'bg-cyan-500'}`} />
            
            <div className="flex flex-col items-start">
              <span className={`text-[10px] font-black uppercase tracking-[0.3em] mb-0.5 ${isWhiteTurn ? 'text-slate-400' : 'text-cyan-400/80'}`}>
                {isWhiteTurn ? 'Tuo Turno' : (gameState.mode === 'PvAI' ? 'Pensiero AI' : 'Turno Nero')}
              </span>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-white uppercase tracking-tighter">
                  {isWhiteTurn ? 'Bianco' : 'Nero'}
                </h3>
                <div className="h-4 w-[2px] bg-white/10" />
                <span className={`text-2xl font-mono font-black tabular-nums tracking-tighter ${activeTime < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                  {formatTime(activeTime)}
                </span>
              </div>
            </div>

            {/* Icon Container */}
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-inner
              ${isWhiteTurn ? 'bg-white text-slate-950 scale-105' : 'bg-cyan-500 text-slate-950 scale-105 shadow-[0_0_20px_rgba(34,211,238,0.4)]'}
            `}>
              {isAiThinking ? (
                <Hourglass className="w-8 h-8 animate-spin" />
              ) : (
                isWhiteTurn ? <User className="w-8 h-8" strokeWidth={3} /> : (gameState.mode === 'PvAI' ? <Cpu className="w-8 h-8" strokeWidth={3} /> : <User className="w-8 h-8" strokeWidth={3} />)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameUI;
