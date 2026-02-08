
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Position, Player, PieceType, Move, CareerLevel, UserProgress } from './types';
import { createInitialBoard, getValidMoves, applyMove, getAllValidMoves } from './services/gameEngine';
import { getBestMove } from './services/aiService';
import { soundService } from './services/soundService';
import { generateCareerLevels, getProgress, saveProgress, calculateStars } from './services/careerService';
import { apiClient } from './services/apiClient';
import AuthModal from './components/AuthModal';
import Board3D from './components/Board3D';
import GameUI from './components/GameUI';
import CareerLobby from './components/CareerLobby';
import CareerSummary from './components/CareerSummary';
import { Users, Cpu, Play, ChevronRight, Globe, Trophy, User, AlertCircle, CheckCircle, Shield, Trash2, X, Send } from 'lucide-react';
import OnlineLobby from './components/OnlineLobby';
import { socketService } from './services/socketService';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
  actions?: { label: string; onClick: () => void; variant?: 'primary' | 'secondary' | 'danger' }[];
}

const INITIAL_TIME = 600;
const STORAGE_KEY = 'dama3d_save_game';

const App: React.FC = () => {
  const [screen, setScreen] = useState<'HOME' | 'CAREER_LOBBY' | 'GAME' | 'ONLINE_LOBBY'>('HOME');
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D');
  const [zoom, setZoom] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [turnToast, setTurnToast] = useState<{ show: boolean, player: null | Player }>({ show: false, player: null });
  const [hasSave, setHasSave] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [lastResults, setLastResults] = useState<{ stars: number, score: number } | null>(null);

  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // ADMIN STATE
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // ONLINE STATE
  const [onlineGameId, setOnlineGameId] = useState<string | null>(null);
  const [onlineOpponent, setOnlineOpponent] = useState<any>(null);
  const [onlineColor, setOnlineColor] = useState<'WHITE' | 'BLACK'>('WHITE');

  // Socket Events
  useEffect(() => {
    if (!currentUser) return;

    if (!socketService.socket.connected) {
      socketService.connect(currentUser);
    }

    const onChallengeReceived = ({ challenger, challengerSocketId }: any) => {
      showToast(`Sfida da ${challenger.username}!`, 'info', [
        {
          label: "Rifiuta", onClick: () => {
            socketService.rejectChallenge(challengerSocketId, currentUser);
            setToast(prev => ({ ...prev, show: false }));
          }, variant: 'secondary'
        },
        {
          label: "Accetta", onClick: () => {
            socketService.acceptChallenge(challengerSocketId, currentUser);
            setToast(prev => ({ ...prev, show: false }));
          }, variant: 'primary'
        }
      ]);
    };

    const onGameStart = ({ opponent, color, gameId }: any) => {
      setOnlineOpponent(opponent);
      setOnlineColor(color);
      setOnlineGameId(gameId);

      setGameState({
        board: createInitialBoard(),
        turn: 'WHITE',
        selectedPiece: null,
        validMoves: [],
        isGameOver: false,
        winner: null,
        timers: { WHITE: INITIAL_TIME, BLACK: INITIAL_TIME },
        history: [],
        mode: 'Online',
        difficulty: 3
      });
      setEarnedStars([]);
      setScreen('GAME');
      setShowSummary(false);
      showToast(`Partita iniziata contro ${opponent.username}! Tu sei ${color === 'WHITE' ? 'BIANCO' : 'NERO'}`, 'success');
    };

    const onOpponentMove = ({ move }: any) => {
      // Logic relies on callback state update in App, so straightforward applyMove works
      if (move.captured) soundService.playCapture();
      else soundService.playMove();
      setGameState(prev => applyMove(prev, move));
    };

    socketService.socket.on('challenge-received', onChallengeReceived);
    socketService.socket.on('game-start', onGameStart);
    socketService.socket.on('opponent-move', onOpponentMove);

    return () => {
      socketService.socket.off('challenge-received', onChallengeReceived);
      socketService.socket.off('game-start', onGameStart);
      socketService.socket.off('opponent-move', onOpponentMove);
    };
  }, [currentUser]); // Removed gameState dependency to fix "used before declaration" if it was that type of error, but mainly to prevent re-attaching listeners on every move

  const handleShare = async () => {
    const url = window.location.origin;
    const text = "Gioca a Dama 3D con me!";
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Dama 3D', text, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast('Link copiato negli appunti!', 'success');
      }
    } catch (e) {
      console.error("Share failed", e);
    }
  };

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', actions?: ToastState['actions']) => {
    setToast({ show: true, message, type, actions });
    if (!actions) {
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    }
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setUserProfile(null);
    localStorage.removeItem('dama_user');
    setToast({ show: false, message: '', type: 'success' });
    showToast('Logout effettuato con successo.', 'success');
  }, [showToast]);

  const requestLogout = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    showToast("Vuoi davvero disconnetterti?", 'info', [
      { label: "Annulla", onClick: () => setToast(prev => ({ ...prev, show: false })), variant: 'secondary' },
      { label: "Esci", onClick: handleLogout, variant: 'danger' }
    ]);
  };

  // Check auth on mount
  useEffect(() => {
    // Check localStorage for persisted user from previous session
    const savedUser = localStorage.getItem('dama_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setUserProfile({ username: user.username }); // Simple placeholder
      } catch (e) {
        console.error("Invalid saved user", e);
      }
    }
  }, []);

  const handleLoginSuccess = async (user: any) => {
    setCurrentUser(user);
    setUserProfile({ username: user.username });
    localStorage.setItem('dama_user', JSON.stringify(user));
    setShowAuthModal(false);
    showToast(`Benvenuto, ${user.username}!`, 'success');
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUsername === 'admin' && adminPassword === 'accessometti') {
      setIsAdminLoggedIn(true);
      loadUsers();
      showToast('Accesso Admin effettuato', 'success');
    } else {
      showToast('Credenziali errate', 'error');
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('http://localhost:3001/api/users');
      if (res.ok) {
        const data = await res.json();
        setAdminUsers(data);
      }
    } catch (e) {
      console.error("Error loading users", e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`Sei sicuro di voler eliminare l'utente ${username}?`)) return;

    try {
      const res = await fetch(`http://localhost:3001/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Utente eliminato', 'success');
        loadUsers(); // Refresh list
      } else {
        showToast('Errore durante eliminazione', 'error');
      }
    } catch (e) {
      showToast('Errore di connessione', 'error');
    }
  };

  const [earnedStars, setEarnedStars] = useState<number[]>([]);

  const handleStarEarned = useCallback((starIndex: number) => {
    setEarnedStars(prev => {
      if (prev.includes(starIndex)) return prev;
      soundService.playStar();
      return [...prev, starIndex];
    });
  }, []);

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

    if (gameState.mode === 'Online') {
      if (gameState.turn !== onlineColor) return;
      socketService.sendMove(onlineGameId!, move, onlineOpponent.socketId);
    }

    const willPromote = piece?.type === PieceType.NORMAL && ((piece.player === 'WHITE' && move.to.row === 0) || (piece.player === 'BLACK' && move.to.row === 7));
    if (willPromote) soundService.playKing();
    else if (move.captured) soundService.playCapture();
    else soundService.playMove();
    setGameState(prev => applyMove(prev, move));
  }, [gameState.board, gameState.mode, gameState.turn, onlineColor, onlineGameId, onlineOpponent]);

  const handlePieceClick = useCallback((pos: Position) => {
    if (gameState.isGameOver) return;
    if ((gameState.mode === 'PvAI' || gameState.mode === 'Career') && gameState.turn === 'BLACK') return;
    if (gameState.mode === 'Online' && gameState.turn !== onlineColor) return;

    const piece = gameState.board[pos.row][pos.col];
    if (piece && piece.player === gameState.turn) {
      const moves = getValidMoves(gameState.board, pos.row, pos.col);
      if (moves.length > 0) soundService.playSelect();
      setGameState(prev => ({ ...prev, selectedPiece: pos, validMoves: moves }));
    }
  }, [gameState, onlineColor]);

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
    setEarnedStars([]);
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
    setEarnedStars([]);
    setScreen('GAME');
    setHasSave(false);
    setShowSummary(false);
  };

  // Auth check for protected modes
  const handleProtectedAction = (action: () => void) => {
    if (!currentUser && !localStorage.getItem('dama_user')) {
      setShowAuthModal(true);
      showToast("Devi accedere per questa modalità!");
    } else {
      action();
    }
  };

  if (screen === 'ONLINE_LOBBY') {
    return (
      <OnlineLobby
        currentUser={currentUser}
        onChallenge={(targetId) => {
          socketService.challengePlayer(targetId, currentUser);
          showToast("Sfida inviata...", 'info');
        }}
        onBack={() => setScreen('HOME')}
      />
    );
  }

  if (screen === 'HOME') {
    return (
      <div className="fixed inset-0 w-full flex flex-col items-center justify-center p-4 overflow-hidden">
        {/* TOAST NOTIFICATION */}
        {toast.show && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[3000] px-6 py-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 flex flex-col items-center gap-3 min-w-[300px]
                ${toast.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-200' :
              toast.type === 'info' ? 'bg-slate-800/90 border-slate-600 text-white' :
                'bg-cyan-500/20 border-cyan-500/50 text-cyan-200'}
            `}>
            <div className="flex items-center gap-3">
              {toast.type === 'error' && <AlertCircle size={20} />}
              {toast.type === 'success' && <CheckCircle size={20} />}
              {toast.type === 'info' && <User size={20} />}
              <span className="font-bold uppercase tracking-wide text-xs text-center">{toast.message}</span>
            </div>

            {toast.actions && (
              <div className="flex gap-2 mt-1 w-full justify-center">
                {toast.actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={action.onClick}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all active:scale-95
                                ${action.variant === 'danger' ? 'bg-red-500 hover:bg-red-600 text-white' :
                        action.variant === 'secondary' ? 'bg-white/10 hover:bg-white/20 text-white' :
                          'bg-cyan-500 hover:bg-cyan-600 text-white'}
                            `}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AUTH MODAL */}
        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleLoginSuccess}
            showToast={showToast}
          />
        )}

        {/* ADMIN MODAL */}
        {showAdminModal && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Shield size={24} />
                  <h2 className="text-xl font-black uppercase tracking-wider">Pannello Admin</h2>
                </div>
                <button onClick={() => setShowAdminModal(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-6">
                {!isAdminLoggedIn ? (
                  <form onSubmit={handleAdminLogin} className="flex flex-col gap-4 max-w-sm mx-auto mt-10">
                    <h3 className="text-white text-center mb-4">Inserisci Credenziali Amministratore</h3>
                    <input
                      type="text"
                      placeholder="Username"
                      value={adminUsername}
                      onChange={e => setAdminUsername(e.target.value)}
                      className="p-3 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 focus:border-cyan-500 outline-none"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      className="p-3 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 focus:border-cyan-500 outline-none"
                    />
                    <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg uppercase tracking-wider transition-all">
                      Accedi
                    </button>
                  </form>
                ) : (
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-white font-bold">Utenti Registrati ({adminUsers.length})</h3>
                      <button onClick={loadUsers} className="text-xs text-cyan-400 hover:underline cursor-pointer">Aggiorna Lista</button>
                    </div>
                    {loadingUsers ? (
                      <div className="text-center text-slate-400 py-10">Caricamento utenti...</div>
                    ) : (
                      <div className="grid gap-2">
                        <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 uppercase px-4 py-2 border-b border-slate-700">
                          <div className="col-span-3">Username</div>
                          <div className="col-span-4">Email</div>
                          <div className="col-span-3">Ultimo Accesso</div>
                          <div className="col-span-2 text-right">Azioni</div>
                        </div>
                        {adminUsers.map(user => (
                          <div key={user.id} className="grid grid-cols-12 gap-2 items-center bg-slate-800/50 hover:bg-slate-800 rounded-lg p-3 text-sm text-slate-300 transition-colors">
                            <div className="col-span-3 font-bold text-white truncate">{user.username}</div>
                            <div className="col-span-4 truncate text-slate-400" title={user.email}>{user.email}</div>
                            <div className="col-span-3 text-xs text-slate-500">{user.last_login ? new Date(user.last_login).toLocaleString() : 'Mai'}</div>
                            <div className="col-span-2 flex justify-end">
                              <button
                                onClick={() => handleDeleteUser(user.id, user.username)}
                                className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all"
                                title="Elimina Utente"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {adminUsers.length === 0 && (
                          <div className="text-center text-slate-500 py-8">Nessun utente trovato.</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ADMIN SHIELD & SHARE BUTTONS (BOTTOM LEFT) */}
        <div className="absolute bottom-4 left-4 z-50 flex gap-2">
          <button
            onClick={() => setShowAdminModal(true)}
            className="p-3 bg-slate-900/50 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-full transition-all text-slate-500 hover:text-cyan-400 group"
          >
            <Shield size={20} className="group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={handleShare}
            className="p-3 bg-slate-900/50 hover:bg-slate-800 border border-slate-700 hover:border-green-500/50 rounded-full transition-all text-slate-500 hover:text-green-400 group"
          >
            <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>

        {/* USER PROFILE BUTTON (TOP RIGHT) */}
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={requestLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 hover:bg-slate-800/80 border border-slate-700 hover:border-cyan-500/50 rounded-full transition-all backdrop-blur-sm group"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentUser ? 'bg-cyan-900/50 border-cyan-500' : 'bg-slate-800 border-slate-600 group-hover:border-slate-500'}`}>
              <User size={16} className={currentUser ? 'text-cyan-400' : 'text-slate-400'} />
            </div>
            <div className="flex flex-col items-start">
              <span className={`text-xs font-black uppercase tracking-widest ${currentUser ? 'text-cyan-400' : 'text-white'}`}>
                {userProfile?.username || 'OSPITE'}
              </span>
              {currentUser && (
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-300">
                  PUNTI: {getProgress().totalStars * 100}
                </span>
              )}
            </div>
          </button>
        </div>

        <div className="z-10 text-center mb-8 animate-in fade-in slide-in-from-top-12 duration-1000">
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-white drop-shadow-[0_15px_15px_rgba(0,0,0,0.8)] font-['Playfair_Display'] italic">
            DAMA <span className="text-cyan-400 not-italic">3D</span>
          </h1>
          <div className="h-1.5 w-24 md:w-40 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto my-4 rounded-full" />
        </div>

        <div className="z-10 flex flex-col gap-4 w-full max-w-2xl animate-in fade-in zoom-in duration-1000 delay-300">
          <button
            onClick={() => {
              soundService.playSelect();
              handleProtectedAction(() => setScreen('CAREER_LOBBY'));
            }}
            className="group relative flex flex-col md:flex-row items-center justify-center p-4 md:p-6 bg-cyan-500/20 border-2 border-cyan-400 rounded-[2rem] hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(34,211,238,0.2)] overflow-hidden"
          >
            <Trophy className="w-8 h-8 md:w-10 md:h-10 text-cyan-400 mb-2 md:mb-0 md:mr-4 group-hover:rotate-12 transition-transform" />
            <div className="text-center md:text-left">
              <h3 className="text-lg md:text-2xl font-black text-white uppercase leading-tight">MODALITÀ CARRIERA</h3>
              <p className="text-cyan-400/70 text-[10px] font-bold uppercase tracking-widest mt-1 md:mt-0">Sblocca 100 sfide epiche</p>
            </div>
            {!currentUser && <div className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Login Richiesto</div>}
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => startGame('PvAI')} className="group p-6 glass-panel rounded-[2rem] border-slate-700 hover:border-cyan-400/50 transition-all flex flex-col items-center">
              <Cpu className="w-8 h-8 text-cyan-400 mb-2" />
              <h3 className="text-xl font-black text-white uppercase text-center">SFIDA CONTRO AI</h3>
            </button>
            <button onClick={() => startGame('PvP')} className="group p-6 glass-panel rounded-[2rem] border-slate-700 hover:border-purple-400/50 transition-all flex flex-col items-center">
              <Users className="w-8 h-8 text-purple-400 mb-2" />
              <h3 className="text-xl font-black text-white uppercase text-center">SFIDA CONTRO UN AMICO</h3>
            </button>
          </div>

          <button onClick={() => handleProtectedAction(() => setScreen('ONLINE_LOBBY'))} className="relative p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-500/20 transition-all active:scale-95 group">
            <Globe className="text-emerald-400" />
            <span className="text-white font-black tracking-widest uppercase">Sfida Online</span>
            {!currentUser && <div className="absolute right-4 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider group-hover:opacity-100 transition-opacity">Login Richiesto</div>}
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'CAREER_LOBBY') {
    return <CareerLobby onSelect={startCareerLevel} onBack={() => setScreen('HOME')} progress={getProgress()} />;
  }

  return (
    <div className="fixed inset-0 w-full bg-[#020617] overflow-hidden flex flex-col items-center touch-none">
      <Board3D
        gameState={gameState}
        onPieceClick={handlePieceClick}
        onSquareClick={handleSquareClick}
        zoomScale={zoom}
        boardRotation={rotation}
        onRotateDrag={(d) => setRotation(r => r - d * 0.7)} // Sensibilità aumentata
        isRotating={isRotating}
        setIsRotating={setIsRotating}
        viewMode={viewMode}
      />
      <GameUI
        gameState={gameState}
        onReset={() => {
          if (gameState.mode === 'Career' && gameState.currentLevelId) {
            const levels = generateCareerLevels();
            const level = levels.find(l => l.id === gameState.currentLevelId);
            if (level) startCareerLevel(level);
            if (level) startCareerLevel(level);
          } else if (gameState.mode === 'Online') {
            setScreen('ONLINE_LOBBY');
          } else if (gameState.mode !== 'Career') {
            startGame(gameState.mode as 'PvP' | 'PvAI' | 'Online');
          }
        }}
        onModeToggle={() => setScreen('HOME')}
        onDifficultyChange={(v) => setGameState(prev => ({ ...prev, difficulty: v }))}
        onZoomIn={() => setZoom(z => Math.min(z + 0.1, 1.5))}
        onZoomOut={() => setZoom(z => Math.max(z - 0.1, 0.5))}
        zoomLevel={zoom}
        onRotate={() => setRotation(r => Math.round(r / 90) * 90 + 90)}
        turnToast={turnToast}
        viewMode={viewMode}
        onToggleView={() => setViewMode(v => v === '2D' ? '3D' : '2D')}
        earnedStars={earnedStars}
        onStarEarned={handleStarEarned}
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
