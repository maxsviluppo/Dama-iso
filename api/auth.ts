import { sql } from '@vercel/postgres';
import { hash, compare } from 'bcryptjs';

// Helper for CORS preflight
const allowCors = (fn: any) => async (req: any, res: any) => {
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    // another common pattern
    // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }
    return await fn(req, res)
}

const handler = async (req: any, res: any) => {
    const { method } = req;

    if (method === 'POST') {
        const { action, username, password, email } = req.body;

        // REGISTER
        if (action === 'register') {
            try {
                // Check if user exists
                const existing = await sql`SELECT * FROM users WHERE username = ${username} OR email = ${email}`;
                if (existing.rows.length > 0) {
                    return res.status(409).json({ error: 'Utente o email già registrati' });
                }

                const hashedPassword = await hash(password, 10);

                await sql`
          INSERT INTO users (username, email, password_hash)
          VALUES (${username}, ${email}, ${hashedPassword})
        `;

                // Fetch created user
                const { rows } = await sql`SELECT id, username, email FROM users WHERE username = ${username}`;

                return res.status(200).json({ user: rows[0], message: 'Registrazione completata!' });
            } catch (error: any) {
                return res.status(500).json({ error: error.message });
            }
        }

        // LOGIN
        if (action === 'login') {
            try {
                const { rows } = await sql`SELECT * FROM users WHERE username = ${username}`;
                const user = rows[0];

                if (!user || !(await compare(password, user.password_hash))) {
                    return res.status(401).json({ error: 'Credenziali non valide' });
                }

                // Return user info (in a real app, you'd verify email, return a JWT token, etc.)
                return res.status(200).json({
                    user: { id: user.id, username: user.username, email: user.email },
                    message: 'Login effettuato!'
                });
            } catch (error: any) {
                return res.status(500).json({ error: error.message });
            }
        }

        return res.status(400).json({ error: 'Azione non valida' });
    }

    return res.status(405).json({ error: 'Metodo non consentito' });
}

export default allowCors(handler);
