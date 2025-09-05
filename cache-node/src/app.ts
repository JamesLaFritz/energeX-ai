// src/app.ts
import express from 'express';
import cors from 'cors';
import mysql, { Pool } from 'mysql2/promise';
import { createClient, type RedisClientType } from 'redis';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://redis:6379';
const ORIGINS = (process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map(s => s.trim());
const TTL = Number(process.env.CACHE_TTL_SECONDS ?? 60);

export async function createApp(opts: {
    connect?: boolean,
    mysql?: ReturnType<typeof mysql.createPool>,
    redis?: RedisClientType
    } = {}) {
    const app = express();

    const db = opts.mysql ?? mysql.createPool({
        host: process.env.MYSQL_HOST ?? 'mysql',
        port: Number(process.env.MYSQL_PORT ?? 3306),
        user: process.env.MYSQL_USER ?? 'appuser',
        password: process.env.MYSQL_PASSWORD ?? 'appsecret',
        database: process.env.MYSQL_DB ?? 'app',
        waitForConnections: true,
        connectionLimit: 5,
    });

    // Redis
    const redis: RedisClientType = opts.redis ?? createClient({ url: REDIS_URL });

    // Optional best-effort connect on boot, but never throw
    if (opts.connect) {
        (async () => {
            try { if (!redis.isOpen) await redis.connect(); } catch (e) {
                console.warn('[startup] redis not ready:', (e as any)?.message);
            }
            try { await db.query('SELECT 1'); } catch (e) {
                console.warn('[startup] mysql not ready:', (e as any)?.message);
            }
        })();
    }

    app.use(cors({
        origin: ORIGINS,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        maxAge: 600,
    }));
    app.options('*', cors()); // preflight

    app.use(express.json());

    // Helper: ensure redis is connected, but don’t explode
    async function ensureRedis() {
        if (!redis.isOpen) {
            try { await redis.connect(); } catch { /* swallow */ }
        }
        return redis.isOpen;
    }

    // ---- routes ----
    app.get('/cache/health', async (_req, res) => {
        try {
            await db.query?.('SELECT 1');
            const rOk = await ensureRedis().then(ok => ok && redis.ping ? redis.ping().then(() => true).catch(() => false) : false);
            res.json({ ok: true, redis: rOk });
        } catch (err: any) {
            res.status(500).json({ ok: false, error: err?.message ?? 'error' });
        }
    });

    app.get('/cache/posts', async (_req, res) => {
        const key = 'posts:all';
        // try cache first, but don’t skip calling get()
        try {
            const hit = await redis.get(key);
            if (hit) return res.json(JSON.parse(hit));
        } catch {/* ignore cache errors */}

        // DB fallback
        const [rows] = await db.query('SELECT * FROM posts ORDER BY created_at DESC');
        res.json({ value: rows, Count: Array.isArray(rows) ? rows.length : 0 });

        // set cache best-effort
        try { await redis.set(key, JSON.stringify(rows), { EX: TTL }); } catch {}
    });

    app.get('/cache/posts/:id', async (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) return res.status(400).json({ message: 'Invalid id' });

        const key = `posts:id:${id}`;

        // try cache first (best-effort)
        try {
            const hit = await redis.get(key);
            if (hit) return res.json(JSON.parse(hit));
        } catch {}

        try {
            const [rows] = await db.query(
                `SELECT p.*,
                        JSON_OBJECT('id', u.id, 'name', u.name, 'email', u.email) AS user
                 FROM posts p
                     JOIN users u ON u.id = p.user_id
                 WHERE p.id = ?
                     LIMIT 1`,
                [id]
            );
            const row = Array.isArray(rows) ? (rows as any[])[0] : undefined;
            if (!row) return res.status(404).json({ message: 'Not found' });

            res.json(row);
            try { await redis.set(key, JSON.stringify(row), { EX: TTL }); } catch {}
        } catch (e: any) {
            res.status(500).json({ error: e?.message ?? 'error' });
        }
    });

    // expose closers for tests
    (app as any).locals.db = db;
    (app as any).locals.redis = redis;
    (app as any).locals.close = async () => {
        try {
            await redis.quit?.();
        } catch {}
        try {
            await (db as any).end?.();
        } catch {}
    };

    return app;
}