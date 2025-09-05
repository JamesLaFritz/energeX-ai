import 'dotenv/config';
import express from 'express';
import { createPool } from 'mysql2/promise';
import { createClient } from 'redis';

const PORT = parseInt(process.env.PORT || '4000', 10);
const CACHE_TTL_SECONDS = parseInt(process.env.CACHE_TTL_SECONDS || '60', 10);
const CACHE_PREFIX = process.env.CACHE_PREFIX || 'lumen_cache';
const keyAll = `${CACHE_PREFIX}:posts:all`;
const keyById  = (id: string) => `${CACHE_PREFIX}:posts:id:${id}`;

// MySQL pool
const mysql = createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DB || 'app',
    waitForConnections: true,
    connectionLimit: 10
});

// Redis client
const redis = createClient({
    url: `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || '6379'}`
});
redis.on('error', (e) => console.error('[redis] error', e));

const app = express();

app.get('/cache/health', async (_req, res) => {
    try {
        await mysql.query('SELECT 1');
        await redis.ping();
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ ok: false, error: (err as Error).message });
    }
});

app.get('/cache/posts', async (_req, res) => {
    const key = 'posts:all';
    try {
        const cached = await redis.get(keyAll);
        if (cached) return res.json(JSON.parse(cached));

        const [rows] = await mysql.query(
            `SELECT p.*, JSON_OBJECT('id', u.id, 'name', u.name, 'email', u.email) as user
       FROM posts p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC`
        );
        await redis.set(keyAll, JSON.stringify(rows), { EX: CACHE_TTL_SECONDS });
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

app.get('/cache/posts/:id', async (req, res) => {
    const { id } = req.params;
    const key = `posts:id:${id}`;
    try {
        const cached = await redis.get(keyById(id));
        if (cached) return res.json(JSON.parse(cached));

        const [rows] = await mysql.query(
            `SELECT p.*, JSON_OBJECT('id', u.id, 'name', u.name, 'email', u.email) as user
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = ?
       LIMIT 1`,
            [id]
        );

        const row = Array.isArray(rows) ? (rows as any[])[0] : null;
        if (!row) return res.status(404).json({ error: 'Not found' });

        await redis.set(keyById(id), JSON.stringify(row), { EX: CACHE_TTL_SECONDS });
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

async function start() {
    await redis.connect();
    app.listen(PORT, () => {
        console.log(`cache-node listening on :${PORT}`);
    });
}

start().catch((e) => {
    console.error('fatal start error', e);
    process.exit(1);
});