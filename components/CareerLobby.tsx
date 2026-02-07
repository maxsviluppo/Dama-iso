
import React from 'react';
import { CareerLevel, UserProgress } from '../types';
import { generateCareerLevels } from '../services/careerService';
import { ChevronLeft, Star, Lock, Trophy, Flag, ChevronDown } from 'lucide-react';

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
    <div className="fixed inset-0 bg-[#020617] flex flex-col animate-in fade-in duration-500 overflow-hidden">
      {/* Header fisso */}
      <div className="z-30 w-full bg-slate-950/80 backdrop-blur-xl border-b border-white/5 p-4 md:p-6 flex justify-between items-center shadow-2xl">
        <button 
          onClick={onBack} 
          className="p-3 bg-slate-900 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all flex items-center gap-2 active:scale-95"
        >
          <ChevronLeft size={20} />
          <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Home</span>
        </button>
        
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tighter italic">LADDER CARRIERA</h2>
          <p className="text-[9px] text-cyan-500 font-bold tracking-[0.3em] uppercase opacity-80">100 Livelli da Sfidare</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/30">
            <Star size={14} className="text-amber-500 fill-amber-500" />
            <span className="text-amber-500 font-black text-sm">{progress.totalStars}</span>
          </div>
        </div>
      </div>

      {/* Area dei livelli scorrevole */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-6 py-6 md:py-10 scroll-smooth overscroll-contain">
        <div className="max-w-xl mx-auto flex flex-col items-center gap-4 pb-32">
          
          {/* Milestone Iniziale */}
          <div className="w-full text-center mb-4 animate-bounce">
             <div className="w-12 h-12 bg-slate-800 rounded-full mx-auto flex items-center justify-center border-2 border-white/10 mb-2">
                <Flag size={20} className="text-cyan-400" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Inizia la tua scalata</p>
             <ChevronDown size={16} className="mx-auto mt-1 text-slate-600" />
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
                    relative w-full group flex items-center gap-4 md:gap-6 p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border-2 transition-all duration-300 active:scale-95
                    ${unlocked 
                      ? 'bg-slate-900/40 border-cyan-500/30 hover:border-cyan-400 hover:bg-slate-900/60 shadow-xl' 
                      : 'bg-slate-950/20 border-slate-800/50 grayscale opacity-60'}
                  `}
                >
                  {/* Badge Livello */}
                  <div className={`
                    w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center transition-all
                    ${unlocked ? 'bg-cyan-500 text-slate-950 shadow-lg group-hover:rotate-6' : 'bg-slate-800 text-slate-600'}
                  `}>
                    <span className="text-xl md:text-2xl font-black italic tracking-tighter">#{level.id}</span>
                  </div>

                  <div className="flex-1 text-left">
                    <h3 className={`font-black uppercase tracking-tight text-sm md:text-lg ${unlocked ? 'text-white' : 'text-slate-600'}`}>
                      {level.title}
                    </h3>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3].map(s => (
                        <Star 
                          key={s} 
                          size={12} 
                          className={result && result.stars >= s ? 'text-amber-500 fill-amber-500' : 'text-slate-800'} 
                        />
                      ))}
                    </div>
                  </div>

                  {!unlocked ? (
                    <Lock className="text-slate-700 mr-2" size={20} />
                  ) : (
                    <div className="flex flex-col items-end mr-2">
                      <span className="text-[9px] font-black text-cyan-400 tracking-widest uppercase mb-0.5">Punti</span>
                      <span className="text-base md:text-lg font-mono font-black text-white">
                        {result?.score || 0}
                      </span>
                    </div>
                  )}

                  {/* Connector visivo del percorso */}
                  {level.id < 100 && (
                     <div className={`absolute -bottom-6 left-10 md:left-12 w-0.5 h-6 transition-colors duration-500 ${unlocked ? 'bg-cyan-500/30' : 'bg-slate-800'}`} />
                  )}
                </button>
                
                {/* Milestone visuale ogni 10 livelli */}
                {level.id % 10 === 0 && level.id < 100 && (
                   <div className="py-4 text-cyan-500/40 font-black text-[9px] tracking-[0.5em] uppercase text-center w-full">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-white/5" />
                        Traguardo {level.id}
                        <div className="flex-1 h-px bg-white/5" />
                      </div>
                   </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
      
      {/* Footer sfumato per indicare scroll */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none z-10" />
    </div>
  );
};

export default CareerLobby;
