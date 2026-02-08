import React, { useState } from 'react';
import { apiClient } from '../services/apiClient';
import { X, Mail, Lock, User, KeyRound, AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
    onClose: () => void;
    onSuccess: (user: any) => void;
    showToast: (msg: string) => void;
}

type AuthMode = 'login' | 'signup' | 'forgot-password';

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess, showToast }) => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        setLoading(true);

        try {
            if (mode === 'signup') {
                const { user, message } = await apiClient.auth.register({ username, email, password });

                showToast(message); // "Registrazione completata!"
                onSuccess(user);
                // Close modal or switch to login if you prefer verify... 
                // For now, auto-login after register is fine for MVP
                onClose();
            } else if (mode === 'login') {
                const { user, message } = await apiClient.auth.login({ username, password });
                showToast(message);
                onSuccess(user);
                onClose();
            } else if (mode === 'forgot-password') {
                setError('Recupero password non ancora disponibile in questa demo.');
            }
        } catch (err: any) {
            let msg = err.message || 'Si è verificato un errore.';
            // ... translate common errors if needed ...
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (newMode: AuthMode) => {
        setMode(newMode);
        setError(null);
        setSuccessMsg(null);
        setShowPassword(false);
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 modal-overlay bg-black/80 backdrop-blur-sm" onPointerDown={onClose}>
            <div
                className="glass-panel w-full max-w-md p-8 rounded-[2rem] border-[3px] border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)] bg-[#0f172a] relative overflow-hidden"
                onPointerDown={e => e.stopPropagation()}
            >
                {/* Background Effects */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <h2 className="text-3xl font-black font-orbitron text-center mb-2 text-white uppercase tracking-wider">
                    {mode === 'login' && 'ACCESSO'}
                    {mode === 'signup' && 'REGISTRAZIONE'}
                    {mode === 'forgot-password' && 'RECUPERO'}
                </h2>

                <p className="text-slate-400 text-center text-xs font-bold mb-8 uppercase tracking-widest">
                    {mode === 'login' && 'Bentornato Operatore'}
                    {mode === 'signup' && 'Unisciti al network'}
                    {mode === 'forgot-password' && 'Ripristina credenziali'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* USERNAME FIELD - ALWAYS VISIBLE (Keys: Login, Signup, Recovery via Username) */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-cyan-400 ml-2">Username</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full bg-slate-900/50 border-2 border-slate-700/50 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none transition-colors font-bold"
                                placeholder={mode === 'forgot-password' ? "Username o Email" : "Il tuo nome in codice"}
                                required
                            />
                        </div>
                    </div>

                    {/* EMAIL FIELD - ONLY FOR REGISTRATION */}
                    {mode === 'signup' && (
                        <div className="space-y-1 animate-fadeIn">
                            <label className="text-[10px] uppercase font-bold text-cyan-400 ml-2">Email (Personale)</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-slate-900/50 border-2 border-slate-700/50 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none transition-colors font-bold"
                                    placeholder="Per il recupero password"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {mode !== 'forgot-password' && (
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-cyan-400 ml-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-slate-900/50 border-2 border-slate-700/50 rounded-xl py-3 pl-12 pr-12 text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none transition-colors font-bold"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            {error}
                        </div>
                    )}

                    {successMsg && (
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-200 text-xs flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            {successMsg}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-4 rounded-xl font-black font-orbitron uppercase tracking-widest shadow-lg shadow-cyan-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none mt-6"
                    >
                        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                        {mode === 'login' && 'ENTRA NEL SISTEMA'}
                        {mode === 'signup' && 'REGISTRATI'}
                        {mode === 'forgot-password' && 'RIPRISTINA PASSWORD'}
                    </button>

                </form>

                <div className="mt-6 flex flex-col items-center gap-3 text-xs font-bold text-slate-400">
                    {mode === 'login' && (
                        <>
                            <button onClick={() => switchMode('signup')} className="hover:text-white transition-colors uppercase tracking-wider">
                                Non hai un account? <span className="text-cyan-400">Registrati</span>
                            </button>
                            <button onClick={() => switchMode('forgot-password')} className="hover:text-white transition-colors flex items-center gap-1">
                                <KeyRound className="w-3 h-3" /> Password dimenticata?
                            </button>
                        </>
                    )}

                    {mode === 'signup' && (
                        <button onClick={() => switchMode('login')} className="hover:text-white transition-colors uppercase tracking-wider">
                            Hai già un account? <span className="text-cyan-400">Accedi</span>
                        </button>
                    )}

                    {mode === 'forgot-password' && (
                        <button onClick={() => switchMode('login')} className="hover:text-white transition-colors uppercase tracking-wider">
                            <span className="text-cyan-400">← Torna al Login</span>
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AuthModal;
