
import React, { useEffect, useState } from 'react';
import { socketService } from '../services/socketService';
import { User, Shield, AlertCircle, Play, X, Swords } from 'lucide-react';

interface OnlineUser {
    userId: string;
    username: string;
    socketId: string;
    status: 'online' | 'playing';
}

interface OnlineLobbyProps {
    currentUser: any;
    onChallenge: (targetSocketId: string) => void;
    onBack: () => void;
}

const OnlineLobby: React.FC<OnlineLobbyProps> = ({ currentUser, onChallenge, onBack }) => {
    const [users, setUsers] = useState<OnlineUser[]>([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!currentUser) return;

        console.log("OnlineLobby: Setup socket per", currentUser.username);

        const onConnect = () => {
            console.log("OnlineLobby: Connesso!");
            setConnected(true);
        };
        const onDisconnect = () => {
            console.log("OnlineLobby: Disconnesso");
            setConnected(false);
        };
        const onUsersList = (list: any[]) => {
            setUsers(list.filter(u => u.username !== currentUser.username));
        };

        socketService.socket.on('connect', onConnect);
        socketService.socket.on('disconnect', onDisconnect);
        socketService.socket.on('online-users', onUsersList);

        if (socketService.socket.connected) {
            setConnected(true);
            socketService.socket.emit('register-user', currentUser);
        } else {
            socketService.connect(currentUser);
        }

        return () => {
            socketService.socket.off('connect', onConnect);
            socketService.socket.off('disconnect', onDisconnect);
            socketService.socket.off('online-users', onUsersList);
        };
    }, [currentUser?.id]); // Solo quando cambia l'utente

    return (
        <div className="fixed inset-0 w-full h-full bg-[#0f172a] text-white flex flex-col p-4 md:p-10 overflow-hidden">
            <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'} animate-pulse`} />
                    <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter">Lobby Online</h1>
                </div>
                <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                    <X />
                </button>
            </div>

            <div className="flex-1 overflow-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center text-slate-500 opacity-50 mt-20">
                        <User size={64} className="mb-4" />
                        <p className="text-xl font-bold uppercase">Nessun giocatore online</p>
                        <p className="text-sm">Aspetta che qualcuno si connetta...</p>
                    </div>
                ) : (
                    users.map((u, idx) => (
                        <div key={idx} className="group relative bg-slate-800/50 hover:bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-cyan-500/50 transition-all flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
                                        <User className="text-slate-400" />
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-800 rounded-full" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{u.username}</h3>
                                    <span className="text-xs text-green-400 font-bold uppercase tracking-wider">Online</span>
                                </div>
                            </div>

                            <button
                                onClick={() => onChallenge(u.socketId)}
                                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold uppercase text-xs tracking-wider flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-cyan-900/20"
                            >
                                <Swords size={16} />
                                Sfida
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-4 text-center text-slate-500 text-xs uppercase tracking-widest">
                Giocatori connessi: {users.length + 1} (Tu incluso)
            </div>
        </div>
    );
};

export default OnlineLobby;
