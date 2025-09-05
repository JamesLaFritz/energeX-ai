import request from 'supertest';
import { createApp } from '../src/app';

describe('cache endpoints', () => {
    it('GET /cache/posts -> cache MISS: queries mysql and sets redis', async () => {
        const rows = [{ id: 1, title: 'A' }];

        const mysql = {
            // IMPORTANT: return a 2-tuple like mysql2/promise does
            query: jest.fn().mockResolvedValueOnce([rows, []]),
            end: jest.fn(),
        } as any;

        const redis = {
            get: jest.fn().mockResolvedValueOnce(null), // MISS
            set: jest.fn().mockResolvedValueOnce('OK'),
            ping: jest.fn().mockResolvedValue('PONG'),
            quit: jest.fn(),
        } as any;

        const app = await createApp({ mysql, redis, connect: false });

        const res = await request(app).get('/cache/posts');
        expect(res.status).toBe(200);
        expect(res.body.value).toEqual(rows);

        expect(redis.get).toHaveBeenCalledWith('posts:all');
        expect(mysql.query).toHaveBeenCalledTimes(1);
        expect(redis.set).toHaveBeenCalledWith('posts:all', JSON.stringify(rows), { EX: expect.any(Number) });

        await app.locals.close();
    });

    it('GET /cache/posts -> cache HIT: serves from redis only', async () => {
        const rows = [{ id: 2, title: 'B' }];

        const mysql = {
            query: jest.fn(), // should NOT be called on hit
            end: jest.fn(),
        } as any;

        const redis = {
            get: jest.fn().mockResolvedValueOnce(JSON.stringify(rows)), // HIT
            set: jest.fn(),
            ping: jest.fn().mockResolvedValue('PONG'),
            quit: jest.fn(),
        } as any;

        const app = await createApp({ mysql, redis, connect: false });

        const res = await request(app).get('/cache/posts');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(rows);

        expect(mysql.query).not.toHaveBeenCalled();
        expect(redis.set).not.toHaveBeenCalled();

        await app.locals.close();
    });

    it('GET /cache/posts/:id invalid -> 400', async () => {
        const mysql = { query: jest.fn(), end: jest.fn() } as any;
        const redis = {
            get: jest.fn(),
            set: jest.fn(),
            ping: jest.fn().mockResolvedValue('PONG'),
            quit: jest.fn(),
        } as any;

        const app = await createApp({ mysql, redis, connect: false });

        const res = await request(app).get('/cache/posts/abc');
        expect(res.status).toBe(400);

        await app.locals.close();
    });
});