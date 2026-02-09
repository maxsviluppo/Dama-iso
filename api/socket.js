import { Server } from 'socket.io';

const SocketHandler = (req, res) => {
    if (res.socket.server.io) {
        // console.log('Socket is already running');
    } else {
        console.log('Socket is initializing');
        const io = new Server(res.socket.server, {
            path: '/api/socket', // Crucial for Vercel
            addTrailingSlash: false,
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        res.socket.server.io = io;

        let connectedUsers = {};

        io.on('connection', socket => {
            console.log('Online User Connected via Vercel:', socket.id);

            socket.on('register-user', (user) => {
                connectedUsers[socket.id] = { ...user, socketId: socket.id };
                io.emit('online-users', Object.values(connectedUsers));
            });

            socket.on('challenge-request', ({ targetSocketId, challenger }) => {
                io.to(targetSocketId).emit('challenge-received', { challenger, challengerSocketId: socket.id });
            });

            socket.on('challenge-response', ({ accepted, challengerSocketId, acceptor }) => {
                if (accepted) {
                    const gameId = `${challengerSocketId}-${socket.id}`;
                    io.to(challengerSocketId).emit('game-start', { opponent: acceptor, color: 'WHITE', gameId });
                    io.to(socket.id).emit('game-start', { opponent: connectedUsers[challengerSocketId], color: 'BLACK', gameId });
                } else {
                    io.to(challengerSocketId).emit('challenge-rejected', { acceptor });
                }
            });

            socket.on('make-move', ({ gameId, move, targetSocketId }) => {
                io.to(targetSocketId).emit('opponent-move', { move });
            });

            socket.on('disconnect', () => {
                delete connectedUsers[socket.id];
                io.emit('online-users', Object.values(connectedUsers));
            });
        });
    }
    res.end();
};

export default SocketHandler;
