import { createClient } from 'redis';
import { env } from './env.js';


const redisUrl = process.env.REDIS_URL ??
    `redis://${process.env.REDIS_HOST ?? 'redis'}:${process.env.REDIS_PORT ?? '6379'}`;


const redis = createClient({ url: redisUrl });
redis.on('error', (e) => console.error('[redis] error', e));
console.log('[cache-node] redisUrl:', redisUrl);

export async function connectRedis() {
    if (!redis.isOpen) await redis.connect();
    return redis;
}

export async function pingRedis() {
    await connectRedis();
    return redis.ping();
}