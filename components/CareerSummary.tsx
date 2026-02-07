
import React from 'react';
import { Star, Trophy, RotateCcw, ArrowRight, Home } from 'lucide-react';

interface CareerSummaryProps {
  results: { stars: number, score: number };
  onNext: () => void;
  onRetry: () => void;
  onLobby: () => void;
}

const CareerSummary: React.FC<CareerSummaryProps> = ({ results, onNext, onRetry, onLobby }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="max-w-md w-full bg-slate-900 border-2 border-cyan-500/30 rounded-[3rem] p-10 text-center shadow-[0_0_100px_rgba(34,211,238,0.2)]">
        <Trophy className="w-20 h-20 text-cyan-400 mx-auto mb-6 animate-bounce" />
        
        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">Livello Completato!</h2>
        
        <div className="flex justify-center gap-3 my-8">
          {[1, 2, 3].map(s => (
            <Star 
              key={s} 
              size={48} 
              className={`
                transition-all duration-1000 delay-${s * 200}
                ${results.stars >= s ? 'text-amber-500 fill-amber-500 scale-110 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-800 scale-90'}
              `}
            />
          ))}
        </div>
        
        <div className="bg-slate-950/50 rounded-2xl p-6 mb-10">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-1 block">Punteggio Totale</span>
          <span className="text-4xl font-mono font-black text-cyan-400 tabular-nums">
            {results.score.toLocaleString()}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {results.stars >= 1 && (
            <button 
              onClick={onNext}
              className="w-full py-5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 hover:scale-105"
            >
              Prossimo Livello <ArrowRight size={20} />
            </button>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={onRetry}
              className="py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> Riprova
            </button>
            <button 
              onClick={onLobby}
              className="py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <Home size={18} /> Mappa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerSummary;
