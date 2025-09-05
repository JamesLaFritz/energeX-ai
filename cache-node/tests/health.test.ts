import request from 'supertest';
import { createApp } from '../src/app';

let app: any;

beforeAll(async () => {
    // minimal fakes so we don't open sockets in CI
    const fakeMysql = {
        query: async () => [[{ ok: 1 }], []],
        end: async () => {},
    } as any;

    const fakeRedis = {
        connect: async () => {},
        ping: async () => 'PONG',
        quit: async () => {},
    } as any;

    app = await createApp({ mysql: fakeMysql, redis: fakeRedis, connect: false });
});

afterAll(async () => {
    await app?.locals?.close?.();
});

it('responds with ok:true when deps are up', async () => {
    const res = await request(app).get('/cache/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
});