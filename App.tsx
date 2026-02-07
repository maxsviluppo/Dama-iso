
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Position, Player, PieceType, Move } from './types';
import { createInitialBoard, getValidMoves, applyMove, getAllValidMoves } from './services/gameEngine';
import { getBestMove } from './services/aiService';
import { soundService } from './services/soundService';
import Board3D from './components/Board3D';
import GameUI from './components/GameUI';
import { Users, Cpu, Play, ChevronRight } from 'lucide-react';

const INITIAL_TIME = 600; // 10 minutes
const STORAGE_KEY = 'dama3d_save_game';

const App: React.FC = () => {
  const [screen, setScreen] = useState<'HOME' | 'GAME'>('HOME');
  const [zoom, setZoom] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [turnToast, setTurnToast] = useState<{ show: boolean, player: Player | null }>({ show: false, player: null });
  const [hasSave, setHasSave] = useState(false);
  
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
      } catch (e) {
        console.error("Failed to parse saved game", e);
      }
    }
  }, []);

  useEffect(() => {
    if (screen === 'GAME' && !gameState.isGameOver) {
      const saveData = {
        gameState,
        zoom,
        rotation,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    }
  }, [gameState, zoom, rotation, screen]);

  useEffect(() => {
    if (screen === 'GAME' && !gameState.isGameOver) {
      setTurnToast({ show: true, player: gameState.turn });
      const timer = setTimeout(() => setTurnToast(prev => ({ ...prev, show: false })), 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState.turn, gameState.isGameOver, screen]);

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
          return {
            ...prev,
            timers: newTimers,
            isGameOver: true,
            winner: prev.turn === 'WHITE' ? 'BLACK' : 'WHITE'
          };
        }
        return { ...prev, timers: newTimers };
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.turn, gameState.isGameOver, screen]);

  useEffect(() => {
    const handleAiTurn = async () => {
      if (screen === 'GAME' && gameState.mode === 'PvAI' && gameState.turn === 'BLACK' && !gameState.isGameOver) {
        await new Promise(r => setTimeout(r, 1200));
        const aiMove = await getBestMove(gameState);
        if (aiMove) {
          const validMoves = getAllValidMoves(gameState.board, 'BLACK');
          const isActuallyValid = validMoves.find(m => 
            m.from.row === aiMove.from.row && m.from.col === aiMove.from.col && 
            m.to.row === aiMove.to.row && m.to.col === aiMove.to.col
          );

          if (isActuallyValid) {
            handleExecuteMove(isActuallyValid);
          } else if (validMoves.length > 0) {
            handleExecuteMove(validMoves[0]);
          }
        } else {
          const validMoves = getAllValidMoves(gameState.board, 'BLACK');
          if (validMoves.length > 0) {
            handleExecuteMove(validMoves[0]);
          }
        }
      }
    };
    handleAiTurn();
  }, [gameState.turn, gameState.mode, gameState.isGameOver, screen]);

  const handleExecuteMove = useCallback((move: Move) => {
    const piece = gameState.board[move.from.row][move.from.col];
    const willPromote = piece?.type === PieceType.NORMAL && 
      ((piece.player === 'WHITE' && move.to.row === 0) || (piece.player === 'BLACK' && move.to.row === 7));

    if (willPromote) {
      soundService.playKing();
    } else if (move.captured) {
      soundService.playCapture();
    } else {
      soundService.playMove();
    }

    setGameState(prev => applyMove(prev, move));
  }, [gameState.board]);

  const handlePieceClick = useCallback((pos: Position) => {
    if (gameState.isGameOver) return;
    if (gameState.mode === 'PvAI' && gameState.turn === 'BLACK') return;

    const piece = gameState.board[pos.row][pos.col];
    if (piece && piece.player === gameState.turn) {
      const moves = getValidMoves(gameState.board, pos.row, pos.col);
      if (moves.length > 0) {
        soundService.playSelect();
      }
      setGameState(prev => ({ ...prev, selectedPiece: pos, validMoves: moves }));
    }
  }, [gameState]);

  const handleSquareClick = useCallback((pos: Position) => {
    if (gameState.isGameOver) return;
    const move = gameState.validMoves.find(m => m.to.row === pos.row && m.to.col === pos.col);
    if (move) {
      handleExecuteMove(move);
    } else {
      if (!gameState.board[pos.row][pos.col]) {
        if (!(gameState.selectedPiece && gameState.validMoves.some(m => !!m.captured))) {
          setGameState(prev => ({ ...prev, selectedPiece: null, validMoves: [] }));
        }
      }
    }
  }, [gameState.validMoves, gameState.isGameOver, gameState.board, gameState.selectedPiece, handleExecuteMove]);

  const handleRotateDrag = (deltaX: number) => {
    setRotation(prev => prev - deltaX * 0.8);
  };

  const startGame = (mode: 'PvP' | 'PvAI') => {
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
  };

  const resumeGame = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGameState(parsed.gameState);
        setZoom(parsed.zoom || 1.0);
        setRotation(parsed.rotation || 0);
        setScreen('GAME');
        soundService.playSelect();
      } catch (e) {
        console.error("Failed to resume game", e);
      }
    }
  };

  const backToHome = () => {
    soundService.playSelect();
    setScreen('HOME');
  };

  if (screen === 'HOME') {
    return (
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px]" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="z-10 text-center mb-12 md:mb-16 animate-in fade-in slide-in-from-top-12 duration-1000">
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-white drop-shadow-[0_15px_15px_rgba(0,0,0,0.8)] font-['Playfair_Display'] italic select-none">
            DAMA <span className="text-cyan-400 not-italic">3D</span>
          </h1>
          <div className="h-1.5 w-24 md:w-40 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto my-4 md:my-6 rounded-full" />
          <p className="text-slate-400 uppercase tracking-[0.4em] md:tracking-[0.8em] font-extrabold text-[10px] md:text-xs opacity-70">Isometric Grandmaster Edition</p>
        </div>

        <div className="z-10 flex flex-col gap-5 w-full max-w-2xl animate-in fade-in zoom-in duration-1000 delay-300">
          {hasSave && (
            <button 
              onClick={resumeGame}
              className="group relative flex items-center justify-between p-1 rounded-3xl bg-cyan-500/10 border border-cyan-400/40 hover:bg-cyan-500/20 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_40px_rgba(34,211,238,0.15)]"
            >
              <div className="flex items-center gap-4 p-5">
                <div className="w-12 h-12 rounded-2xl bg-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                  <Play className="w-6 h-6 text-slate-950 fill-slate-950 ml-1" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">CONTINUA</h3>
                  <p className="text-cyan-400/70 text-[10px] font-bold uppercase tracking-widest">Torna alla sfida in corso</p>
                </div>
              </div>
              <ChevronRight className="w-8 h-8 text-cyan-400/50 mr-6 group-hover:translate-x-2 transition-transform" />
            </button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <button 
              onClick={() => startGame('PvAI')}
              className="group relative flex flex-col items-center justify-center p-8 md:p-10 glass-panel rounded-[2.5rem] transition-all hover:border-cyan-400/50 hover:shadow-[0_0_40px_rgba(34,211,238,0.1)] active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center mb-6 group-hover:border-cyan-400 group-hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] transition-all">
                <Cpu className="w-8 h-8 md:w-10 md:h-10 text-cyan-400 group-hover:rotate-12 transition-transform" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white mb-1 uppercase tracking-tighter">VS IA</h3>
              <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-60">Adaptive Gemini Brain</p>
            </button>

            <button 
              onClick={() => startGame('PvP')}
              className="group relative flex flex-col items-center justify-center p-8 md:p-10 glass-panel rounded-[2.5rem] transition-all hover:border-purple-400/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.1)] active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center mb-6 group-hover:border-purple-400 group-hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all">
                <Users className="w-8 h-8 md:w-10 md:h-10 text-purple-400 group-hover:-rotate-12 transition-transform" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white mb-1 uppercase tracking-tighter">VS AMICO</h3>
              <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-60">Locale Multiplayer</p>
            </button>
          </div>
        </div>

        <footer className="z-10 mt-12 md:mt-20 text-slate-600 text-[8px] md:text-[10px] font-black tracking-[0.4em] md:tracking-[0.6em] uppercase opacity-50 text-center px-4">
          Professional Game Engine • Ultra-Low Latency • 3D Isometric View
        </footer>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#020617] overflow-hidden flex flex-col items-center">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-cyan-500 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-purple-500 rounded-full blur-[150px]" />
      </div>

      <Board3D 
        gameState={gameState}
        onPieceClick={handlePieceClick}
        onSquareClick={handleSquareClick}
        zoomScale={zoom}
        boardRotation={rotation}
        onRotateDrag={handleRotateDrag}
        isRotating={isRotating}
        setIsRotating={setIsRotating}
      />

      <GameUI 
        gameState={gameState} 
        onReset={() => startGame(gameState.mode)}
        onModeToggle={backToHome}
        onDifficultyChange={(v) => {
          soundService.playSelect();
          setGameState(prev => ({ ...prev, difficulty: v }));
        }}
        onZoomIn={() => {
          soundService.playSelect();
          setZoom(z => Math.min(z + 0.1, 1.5));
        }}
        onZoomOut={() => {
          soundService.playSelect();
          setZoom(z => Math.max(z - 0.1, 0.5));
        }}
        zoomLevel={zoom}
        onRotate={() => {
           soundService.playSelect();
           setIsRotating(false); 
           setRotation(r => Math.round(r / 90) * 90 + 90);
        }}
        turnToast={turnToast}
      />
    </div>
  );
};

export default App;
