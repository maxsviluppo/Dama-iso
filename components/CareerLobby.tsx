
import React from 'react';
import { CareerLevel, UserProgress } from '../types';
import { generateCareerLevels } from '../services/careerService';
import { ChevronLeft, Star, Lock, Trophy, Flag } from 'lucide-react';

interface CareerLobbyProps {
  onSelect: (level: CareerLevel) => void;
  onBack: () => void;
  progress: UserProgress;
}

const CareerLobby: React.FC<CareerLobbyProps> = ({ onSelect, onBack, progress }) => {
  const levels = generateCareerLevels();
  
  const isUnlocked = (id: number) => {
    if (id === 1) return true;
    const prev = progress.results[id - 1];
    return prev && prev.stars >= 1;
  };

  return (
    <div className="relative min-h-screen w-full bg-[#020617] flex flex-col animate-in fade-in duration-500 overflow-hidden">
      {/* Header fisso */}
      <div className="z-20 w-full bg-slate-950/80 backdrop-blur-xl border-b border-white/5 p-6 flex justify-between items-center shadow-2xl">
        <button onClick={onBack} className="p-3 bg-slate-900 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all flex items-center gap-2">
          <ChevronLeft size={20} />
          <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Home</span>
        </button>
        
        <div className="text-center">
          <h2 className="text-2xl font-black text-white tracking-tighter italic">LADDER CARRIERA</h2>
          <p className="text-[9px] text-cyan-500 font-bold tracking-[0.3em] uppercase opacity-80">Scala la vetta dei 100 livelli</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/30">
            <Star size={14} className="text-amber-500 fill-amber-500" />
            <span className="text-amber-500 font-black text-sm">{progress.totalStars}</span>
          </div>
        </div>
      </div>

      {/* Contenuto scorrevole verticale */}
      <div className="flex-1 overflow-y-auto px-6 py-10 scrollbar-hide">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-6 pb-20">
          
          {/* Milestone Iniziale */}
          <div className="w-full text-center py-4">
             <div className="w-12 h-12 bg-slate-800 rounded-full mx-auto flex items-center justify-center border-2 border-white/10 mb-2">
                <Flag size={20} className="text-slate-400" />
             </div>
             <div className="h-10 w-1 bg-gradient-to-b from-transparent via-cyan-500/30 to-cyan-500/50 mx-auto" />
          </div>

          {levels.map((level) => {
            const unlocked = isUnlocked(level.id);
            const result = progress.results[level.id];
            
            return (
              <React.Fragment key={level.id}>
                <button
                  disabled={!unlocked}
                  onClick={() => onSelect(level)}
                  className={`
                    relative w-full group flex items-center gap-6 p-4 rounded-[2rem] border-2 transition-all duration-300
                    ${unlocked 
                      ? 'bg-slate-900/40 border-cyan-500/30 hover:border-cyan-400 hover:bg-slate-900/60 hover:scale-[1.02] shadow-xl' 
                      : 'bg-slate-950/20 border-slate-800/50 grayscale opacity-60'}
                  `}
                >
                  {/* Badge Livello */}
                  <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center transition-all
                    ${unlocked ? 'bg-cyan-500 text-slate-950 shadow-lg group-hover:rotate-6' : 'bg-slate-800 text-slate-600'}
                  `}>
                    <span className="text-2xl font-black italic tracking-tighter">#{level.id}</span>
                  </div>

                  <div className="flex-1 text-left">
                    <h3 className={`font-black uppercase tracking-tight text-lg ${unlocked ? 'text-white' : 'text-slate-600'}`}>
                      {level.title}
                    </h3>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3].map(s => (
                        <Star 
                          key={s} 
                          size={14} 
                          className={result && result.stars >= s ? 'text-amber-500 fill-amber-500' : 'text-slate-800'} 
                        />
                      ))}
                    </div>
                  </div>

                  {!unlocked ? (
                    <Lock className="text-slate-700 mr-4" size={24} />
                  ) : (
                    <div className="flex flex-col items-end mr-4">
                      <span className="text-[10px] font-black text-cyan-400 tracking-widest uppercase mb-1">Punti</span>
                      <span className="text-lg font-mono font-black text-white">
                        {result?.score || 0}
                      </span>
                    </div>
                  )}

                  {/* Connector per il percorso */}
                  {level.id < 100 && (
                     <div className={`absolute -bottom-8 left-12 w-1 h-6 transition-colors duration-500 ${unlocked ? 'bg-cyan-500/50' : 'bg-slate-800'}`} />
                  )}
                </button>
                
                {/* Visual separator every 5 levels */}
                {level.id % 5 === 0 && level.id < 100 && (
                   <div className="py-2 text-slate-700 font-black text-[10px] tracking-[0.5em] uppercase opacity-40">
                      Milestone {level.id}
                   </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CareerLobby;
