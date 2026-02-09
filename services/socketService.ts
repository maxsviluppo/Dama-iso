
import { io } from "socket.io-client";

// LOGICA DINAMICA: 
// Se siamo su localhost (PC), usa il server locale su 3001.
// Se siamo online, usa l'URL di Render.
const getSocketUrl = () => {
    if (typeof window === 'undefined') return 'http://localhost:3001';

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
        return 'http://localhost:3001';
    }

    // In produzione (Vercel), usiamo Render
    return 'https://dama-iso.onrender.com';
};

const SOCKET_URL = getSocketUrl();

const socket = io(SOCKET_URL, {
    autoConnect: false,
    // Se siamo in locale usiamo il path standard, su Vercel usiamo /api/socket
    path: SOCKET_URL.includes('localhost') ? '/socket.io' : '/api/socket',
    transports: ['websocket', 'polling']
});

export const connectSocket = (user: any) => {
    socket.auth = { user };
    socket.connect();
    socket.emit('register-user', user);
};

export const disconnectSocket = () => {
    socket.disconnect();
};

export const socketService = {
    socket,
    connect: connectSocket,
    disconnect: disconnectSocket,

    challengePlayer: (targetSocketId: string, challenger: any) => {
        socket.emit('challenge-request', { targetSocketId, challenger });
    },

    acceptChallenge: (challengerSocketId: string, acceptor: any) => {
        socket.emit('challenge-response', { accepted: true, challengerSocketId, acceptor });
    },

    rejectChallenge: (challengerSocketId: string, acceptor: any) => {
        socket.emit('challenge-response', { accepted: false, challengerSocketId, acceptor });
    },

    sendMove: (gameId: string, move: any, targetSocketId: string) => {
        socket.emit('make-move', { gameId, move, targetSocketId });
    }
};
