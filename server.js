import express from 'express';
import pg from 'pg';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

const { hash, compare } = bcrypt;

dotenv.config();

const { Pool } = pg;
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: [
            "http://localhost:3002",
            "https://dama-oimfigf37-castromassimo-4092s-projects.vercel.app",
            "https://dama-iso.vercel.app" // In case you have a custom or shorter domain later
        ],
        methods: ["GET", "POST"]
    }
});

const port = 3001; // API Server on 3001 (Frontend on 3002)

app.use(cors());
app.use(express.json());

// Socket.IO Logic
let connectedUsers = {}; // { socketId: { userId, username } }

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('register-user', (user) => {
        const userWithId = { ...user, socketId: socket.id };
        connectedUsers[socket.id] = userWithId;
        io.emit('online-users', Object.values(connectedUsers));
    });

    socket.on('challenge-request', ({ targetSocketId, challenger }) => {
        io.to(targetSocketId).emit('challenge-received', { challenger, challengerSocketId: socket.id });
    });

    socket.on('challenge-response', ({ accepted, challengerSocketId, acceptor }) => {
        if (accepted) {
            // Start Game for both
            const gameId = `${challengerSocketId}-${socket.id}`;
            const gameData = { gameId, players: { white: challengerSocketId, black: socket.id } }; // Challenger is White

            io.to(challengerSocketId).emit('game-start', { opponent: acceptor, color: 'WHITE', gameId });
            io.to(socket.id).emit('game-start', { opponent: connectedUsers[challengerSocketId], color: 'BLACK', gameId });
        } else {
            io.to(challengerSocketId).emit('challenge-rejected', { acceptor });
        }
    });

    socket.on('make-move', ({ gameId, move, targetSocketId }) => {
        io.to(targetSocketId).emit('opponent-move', { move });
    });

    socket.on('game-over', ({ gameId, winner, loser }) => {
        // Here you would typically save the result to DB
        console.log(`Game Over: ${winner} beat ${loser}`);
    });

    socket.on('disconnect', () => {
        delete connectedUsers[socket.id];
        io.emit('online-users', Object.values(connectedUsers));
        console.log('User disconnected:', socket.id);
    });
});


// Connection using the Neon URL from .env
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false } // Required for Neon
});

// Test Endpoint
app.get('/api/health', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        res.json({ status: 'ok', db_time: result.rows[0].now });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

// Setup DB Endpoint (One-time use via Browser/Curl)
app.get('/api/setup-db', async (req, res) => {
    try {
        const client = await pool.connect();
        await client.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP WITH TIME ZONE
            );
        `);
        client.release();
        res.json({ message: 'Database users table initialized successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Auth Endpoint (Login/Register)
app.post('/api/auth', async (req, res) => {
    const { action, username, password, email } = req.body;
    let client;

    try {
        client = await pool.connect();

        if (action === 'register') {
            const existing = await client.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
            if (existing.rows.length > 0) {
                return res.status(409).json({ error: 'Utente o email già registrati' });
            }

            const hashedPassword = await hash(password, 10);

            const newUser = await client.query(
                'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
                [username, email, hashedPassword]
            );

            return res.json({ user: newUser.rows[0], message: 'Registrazione completata!' });
        }

        if (action === 'login') {
            const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
            const user = result.rows[0];

            if (!user || !(await compare(password, user.password_hash))) {
                return res.status(401).json({ error: 'Credenziali non valide' });
            }

            // Update last login
            await client.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

            return res.json({
                user: { id: user.id, username: user.username, email: user.email },
                message: 'Login effettuato!'
            });
        }

        return res.status(400).json({ error: 'Invalid action' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
});

// ADMIN API: Get All Users
app.get('/api/users', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT id, username, email, created_at, last_login FROM users ORDER BY created_at DESC');
        client.release();
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ADMIN API: Delete User
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const client = await pool.connect();
        await client.query('DELETE FROM users WHERE id = $1', [id]);
        client.release();
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Export app for Vercel
export default app;

// Only start the server if running directly (locally)
if (process.env.NODE_ENV !== 'production' || import.meta.url === `file://${process.argv[1]}`) {
    httpServer.listen(port, () => {
        console.log(`Backend API Server running at http://localhost:${port}`);
    });
}
