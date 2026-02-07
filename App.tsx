
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Position, Player, PieceType, Move, CareerLevel, UserProgress } from './types';
import { createInitialBoard, getValidMoves, applyMove, getAllValidMoves } from './services/gameEngine';
import { getBestMove } from './services/aiService';
import { soundService } from './services/soundService';
import { generateCareerLevels, getProgress, saveProgress, calculateStars } from './services/careerService';
import Board3D from './components/Board3D';
import GameUI from './components/GameUI';
import CareerLobby from './components/CareerLobby';
import CareerSummary from './components/CareerSummary';
import { Users, Cpu, Play, ChevronRight, Globe, Trophy } from 'lucide-react';

const INITIAL_TIME = 600; 
const STORAGE_KEY = 'dama3d_save_game';

const App: React.FC = () => {
  const [screen, setScreen] = useState<'HOME' | 'CAREER_LOBBY' | 'GAME'>('HOME');
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D');
  const [zoom, setZoom] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [turnToast, setTurnToast] = useState<{ show: boolean, player: Player | null }>({ show: false, player: null });
  const [hasSave, setHasSave] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [lastResults, setLastResults] = useState<{stars: number, score: number} | null>(null);
  
  const [gameState, setGameState] = useState<GameState>({
    board: createInitialBoard(),
    turn: 'WHITE',
    selectedPiece: null,
    validMoves: [],
    isGameOver: false,
    winner: null,
    timers: { WHITE: INITIAL_TIME, BLACK: INITIAL_TIME },
    history: [],
    mode: 'PvAI',
    difficulty: 3
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.gameState && !parsed.gameState.isGameOver) {
          setHasSave(true);
        }
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (gameState.isGameOver && gameState.mode === 'Career' && !showSummary) {
      const results = calculateStars(gameState, gameState.timers.WHITE);
      if (gameState.currentLevelId) {
        saveProgress(gameState.currentLevelId, results.stars, results.score);
      }
      setLastResults(results);
      setShowSummary(true);
    }
  }, [gameState.isGameOver, gameState.mode]);

  useEffect(() => {
    if (screen === 'GAME' && !gameState.isGameOver && gameState.mode !== 'Online') {
      const saveData = { gameState, zoom, rotation, timestamp: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    }
  }, [gameState, zoom, rotation, screen]);

  useEffect(() => {
    if (screen !== 'GAME' || gameState.isGameOver) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setGameState(prev => {
        const newTimers = { ...prev.timers };
        newTimers[prev.turn] = Math.max(0, newTimers[prev.turn] - 1);
        if (newTimers[prev.turn] === 0) {
          return { ...prev, timers: newTimers, isGameOver: true, winner: prev.turn === 'WHITE' ? 'BLACK' : 'WHITE' };
        }
        return { ...prev, timers: newTimers };
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState.turn, gameState.isGameOver, screen]);

  useEffect(() => {
    const handleAiTurn = async () => {
      if (screen === 'GAME' && (gameState.mode === 'PvAI' || gameState.mode === 'Career') && gameState.turn === 'BLACK' && !gameState.isGameOver) {
        await new Promise(r => setTimeout(r, 1200));
        const aiMove = await getBestMove(gameState);
        if (aiMove) {
          const validMoves = getAllValidMoves(gameState.board, 'BLACK');
          const isActuallyValid = validMoves.find(m => m.from.row === aiMove.from.row && m.from.col === aiMove.from.col && m.to.row === aiMove.to.row && m.to.col === aiMove.to.col);
          if (isActuallyValid) handleExecuteMove(isActuallyValid);
          else if (validMoves.length > 0) handleExecuteMove(validMoves[0]);
        } else {
          const validMoves = getAllValidMoves(gameState.board, 'BLACK');
          if (validMoves.length > 0) handleExecuteMove(validMoves[0]);
        }
      }
    };
    handleAiTurn();
  }, [gameState.turn, gameState.mode, gameState.isGameOver, screen]);

  const handleExecuteMove = useCallback((move: Move) => {
    const piece = gameState.board[move.from.row][move.from.col];
    const willPromote = piece?.type === PieceType.NORMAL && ((piece.player === 'WHITE' && move.to.row === 0) || (piece.player === 'BLACK' && move.to.row === 7));
    if (willPromote) soundService.playKing();
    else if (move.captured) soundService.playCapture();
    else soundService.playMove();
    setGameState(prev => applyMove(prev, move));
  }, [gameState.board]);

  const handlePieceClick = useCallback((pos: Position) => {
    if (gameState.isGameOver) return;
    if ((gameState.mode === 'PvAI' || gameState.mode === 'Career') && gameState.turn === 'BLACK') return;
    const piece = gameState.board[pos.row][pos.col];
    if (piece && piece.player === gameState.turn) {
      const moves = getValidMoves(gameState.board, pos.row, pos.col);
      if (moves.length > 0) soundService.playSelect();
      setGameState(prev => ({ ...prev, selectedPiece: pos, validMoves: moves }));
    }
  }, [gameState]);

  const handleSquareClick = useCallback((pos: Position) => {
    if (gameState.isGameOver) return;
    const move = gameState.validMoves.find(m => m.to.row === pos.row && m.to.col === pos.col);
    if (move) handleExecuteMove(move);
    else if (!gameState.board[pos.row][pos.col]) {
      if (!(gameState.selectedPiece && gameState.validMoves.some(m => !!m.captured))) {
        setGameState(prev => ({ ...prev, selectedPiece: null, validMoves: [] }));
      }
    }
  }, [gameState.validMoves, gameState.isGameOver, gameState.board, gameState.selectedPiece, handleExecuteMove]);

  const startCareerLevel = (level: CareerLevel) => {
    soundService.playSelect();
    setGameState({
      board: createInitialBoard(),
      turn: 'WHITE',
      selectedPiece: null,
      validMoves: [],
      isGameOver: false,
      winner: null,
      timers: { WHITE: INITIAL_TIME, BLACK: INITIAL_TIME },
      history: [],
      mode: 'Career',
      difficulty: level.difficulty,
      currentLevelId: level.id
    });
    setScreen('GAME');
    setShowSummary(false);
  };

  const startGame = (mode: 'PvP' | 'PvAI' | 'Online') => {
    soundService.playSelect();
    setGameState({
      board: createInitialBoard(),
      turn: 'WHITE',
      selectedPiece: null,
      validMoves: [],
      isGameOver: false,
      winner: null,
      timers: { WHITE: INITIAL_TIME, BLACK: INITIAL_TIME },
      history: [],
      mode,
      difficulty: gameState.difficulty
    });
    setScreen('GAME');
    setHasSave(false);
    setShowSummary(false);
  };

  if (screen === 'HOME') {
    return (
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="z-10 text-center mb-8 animate-in fade-in slide-in-from-top-12 duration-1000">
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-white drop-shadow-[0_15px_15px_rgba(0,0,0,0.8)] font-['Playfair_Display'] italic">
            DAMA <span className="text-cyan-400 not-italic">3D</span>
          </h1>
          <div className="h-1.5 w-24 md:w-40 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto my-4 rounded-full" />
        </div>

        <div className="z-10 flex flex-col gap-4 w-full max-w-2xl animate-in fade-in zoom-in duration-1000 delay-300">
          <button 
            onClick={() => setScreen('CAREER_LOBBY')}
            className="group relative flex items-center justify-center p-6 bg-cyan-500/20 border-2 border-cyan-400 rounded-[2rem] hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(34,211,238,0.2)] overflow-hidden"
          >
            <Trophy className="w-10 h-10 text-cyan-400 mr-4 group-hover:rotate-12 transition-transform" />
            <div className="text-left">
              <h3 className="text-2xl font-black text-white uppercase">MODALITÀ CARRIERA</h3>
              <p className="text-cyan-400/70 text-[10px] font-bold uppercase tracking-widest">Sblocca 100 sfide epiche</p>
            </div>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => startGame('PvAI')} className="group p-6 glass-panel rounded-[2rem] border-slate-700 hover:border-cyan-400/50 transition-all flex flex-col items-center">
              <Cpu className="w-8 h-8 text-cyan-400 mb-2" />
              <h3 className="text-xl font-black text-white uppercase">VS IA</h3>
            </button>
            <button onClick={() => startGame('PvP')} className="group p-6 glass-panel rounded-[2rem] border-slate-700 hover:border-purple-400/50 transition-all flex flex-col items-center">
              <Users className="w-8 h-8 text-purple-400 mb-2" />
              <h3 className="text-xl font-black text-white uppercase">VS AMICO</h3>
            </button>
          </div>

          <button onClick={() => startGame('Online')} className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-500/20 transition-all">
             <Globe className="text-emerald-400" />
             <span className="text-white font-black tracking-widest uppercase">Sfida Online</span>
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'CAREER_LOBBY') {
    return <CareerLobby onSelect={startCareerLevel} onBack={() => setScreen('HOME')} progress={getProgress()} />;
  }

  return (
    <div className="relative min-h-screen w-full bg-[#020617] overflow-hidden flex flex-col items-center">
      <Board3D 
        gameState={gameState} 
        onPieceClick={handlePieceClick} 
        onSquareClick={handleSquareClick} 
        zoomScale={zoom} 
        boardRotation={rotation} 
        onRotateDrag={(d) => setRotation(r => r - d * 0.8)} 
        isRotating={isRotating} 
        setIsRotating={setIsRotating} 
        viewMode={viewMode}
      />
      <GameUI 
        gameState={gameState} 
        onReset={() => startGame(gameState.mode)} 
        onModeToggle={() => setScreen('HOME')} 
        onDifficultyChange={(v) => setGameState(prev => ({ ...prev, difficulty: v }))} 
        onZoomIn={() => setZoom(z => Math.min(z + 0.1, 1.5))} 
        onZoomOut={() => setZoom(z => Math.max(z - 0.1, 0.5))} 
        zoomLevel={zoom} 
        onRotate={() => setRotation(r => Math.round(r / 90) * 90 + 90)} 
        turnToast={turnToast}
        viewMode={viewMode}
        onToggleView={() => setViewMode(v => v === '2D' ? '3D' : '2D')}
      />
      {showSummary && lastResults && (
        <CareerSummary 
          results={lastResults} 
          onNext={() => {
            const next = gameState.currentLevelId ? gameState.currentLevelId + 1 : 1;
            const levels = generateCareerLevels();
            const level = levels.find(l => l.id === next);
            if (level) startCareerLevel(level);
            else setScreen('CAREER_LOBBY');
          }} 
          onRetry={() => {
            const levels = generateCareerLevels();
            const level = levels.find(l => l.id === gameState.currentLevelId);
            if (level) startCareerLevel(level);
          }}
          onLobby={() => setScreen('CAREER_LOBBY')}
        />
      )}
    </div>
  );
};

export default App;
