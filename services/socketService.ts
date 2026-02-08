
import { io } from "socket.io-client";

const socket = io('http://localhost:3001', {
    autoConnect: false
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
