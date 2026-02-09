
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : 'http://localhost:3001');

const socket = io(SOCKET_URL, {
    autoConnect: false,
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
