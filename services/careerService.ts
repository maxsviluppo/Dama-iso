
import { CareerLevel, UserProgress, LevelResult, GameState } from '../types';

const PROGRESS_KEY = 'dama3d_career_progress';

// Simulazione Supabase (Configurazione futura)
// const SUPABASE_URL = process.env.SUPABASE_URL;
// const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

export const generateCareerLevels = (): CareerLevel[] => {
  return Array.from({ length: 100 }, (_, i) => {
    const levelId = i + 1;
    // La difficoltà scala ogni 20 livelli
    const difficulty = Math.min(5, Math.floor(i / 20) + 1);
    return {
      id: levelId,
      title: `Sfida ${levelId}`,
      difficulty,
      requiredStars: i === 0 ? 0 : 1, // Placeholder per logiche di sblocco più complesse
      basePoints: 100 * levelId
    };
  });
};

export const getProgress = (): UserProgress => {
  const saved = localStorage.getItem(PROGRESS_KEY);
  if (saved) return JSON.parse(saved);
  return {
    totalScore: 0,
    totalStars: 0,
    results: {}
  };
};

export const saveProgress = (levelId: number, stars: number, score: number) => {
  const progress = getProgress();
  const existing = progress.results[levelId];
  
  // Aggiorna solo se il punteggio o le stelle sono migliori
  if (!existing || stars > existing.stars || score > existing.score) {
    const oldStars = existing?.stars || 0;
    const oldScore = existing?.score || 0;
    
    progress.results[levelId] = {
      levelId,
      stars,
      score,
      completedAt: Date.now()
    };
    
    progress.totalStars += (stars - oldStars);
    progress.totalScore += (score - oldScore);
    
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    
    // Qui andrebbe la chiamata a Supabase:
    // supabase.from('user_career').upsert({ user_id: '...', level_id: levelId, stars, score })
  }
};

export const calculateStars = (state: GameState, timeRemaining: number): { stars: number; score: number } => {
  if (state.winner !== 'WHITE') return { stars: 0, score: 0 };

  const level = generateCareerLevels().find(l => l.id === state.currentLevelId);
  const basePoints = level ? level.basePoints : 500;
  
  // Bonus mosse (meno mosse = più punti)
  const movesBonus = Math.max(0, 500 - state.history.length * 10);
  
  // Bonus tempo (2 punti per ogni secondo risparmiato)
  const timeBonus = timeRemaining * 2;
  
  const totalScore = basePoints + movesBonus + timeBonus;

  // Soglie stelle
  let stars = 1;
  if (totalScore > basePoints * 2.5) stars = 3;
  else if (totalScore > basePoints * 1.5) stars = 2;

  return { stars, score: totalScore };
};
