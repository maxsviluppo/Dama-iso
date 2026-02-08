import express from 'express';
import pg from 'pg';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
const { hash, compare } = bcrypt;

dotenv.config();

const { Pool } = pg;
const app = express();
const port = 3001; // API Server on 3001 (Frontend on 3002)

app.use(cors());
app.use(express.json());

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

app.listen(port, () => {
    console.log(`Backend API Server running at http://localhost:${port}`);
});
