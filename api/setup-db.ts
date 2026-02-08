import { sql } from '@vercel/postgres';

export default async function handler(req: any, res: any) {
    try {
        // Drop existing table if needed (be careful in production!)
        // await sql`DROP TABLE IF EXISTS users;`;

        await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP WITH TIME ZONE
      );
    `;

        // Enable UUID extension if not enabled
        await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;

        return res.status(200).json({ message: 'Database schema initialized successfully' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}
