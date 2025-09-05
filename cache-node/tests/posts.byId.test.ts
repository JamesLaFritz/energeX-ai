import request from 'supertest';
import { createApp } from '../src/app';

const makeApp = async ({
                           byIdRow,
                           hit = false,
                       }: {
    byIdRow?: any | null;
    hit?: boolean;
}) => {
    const mysql = {
        query: jest.fn().mockResolvedValueOnce([[byIdRow ?? null].filter(Boolean), []]),
        end: jest.fn(),
    } as any;

    const redis = {
        get: jest.fn().mockResolvedValueOnce(
            hit && byIdRow ? JSON.stringify(byIdRow) : null
        ),
        set: jest.fn().mockResolvedValue('OK'),
        ping: jest.fn().mockResolvedValue('PONG'),
        quit: jest.fn(),
    } as any;

    const app = await createApp({ mysql, redis, connect: false });
    return { app, mysql, redis };
};

it('GET /cache/posts/:id invalid -> 400', async () => {
    const { app } = await makeApp({ byIdRow: null });
    const res = await request(app).get('/cache/posts/abc');
    expect(res.status).toBe(400);
    await app.locals.close();
});

it('GET /cache/posts/:id MISS -> queries DB and sets redis', async () => {
    const row = { id: 1, title: 'A', user: { id: 7, name: 'U', email: 'u@e' } };
    const { app, mysql, redis } = await makeApp({ byIdRow: row, hit: false });

    const res = await request(app).get('/cache/posts/1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(row);

    expect(redis.get).toHaveBeenCalledWith('posts:id:1');
    expect(mysql.query).toHaveBeenCalledTimes(1);
    expect(redis.set).toHaveBeenCalledWith('posts:id:1', JSON.stringify(row), {
        EX: expect.any(Number),
    });

    await app.locals.close();
});

it('GET /cache/posts/:id HIT -> serves from redis only', async () => {
    const row = { id: 2, title: 'B', user: { id: 9, name: 'V', email: 'v@e' } };
    const { app, mysql, redis } = await makeApp({ byIdRow: row, hit: true });

    const res = await request(app).get('/cache/posts/2');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(row);

    expect(mysql.query).not.toHaveBeenCalled();
    expect(redis.set).not.toHaveBeenCalled();

    await app.locals.close();
});

it('GET /cache/posts/:id not found -> 404', async () => {
    const { app, mysql, redis } = await makeApp({ byIdRow: null, hit: false });

    const res = await request(app).get('/cache/posts/999');
    expect(res.status).toBe(404);

    expect(redis.get).toHaveBeenCalledWith('posts:id:999');
    expect(mysql.query).toHaveBeenCalledTimes(1);

    await app.locals.close();
});
