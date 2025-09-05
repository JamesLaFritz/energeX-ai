import { z } from 'zod';


const envSchema = z.object({
    PORT: z.coerce.number().default(4000),
    MYSQL_HOST: z.string().default('mysql'),
    MYSQL_PORT: z.coerce.number().default(3306),
    MYSQL_USER: z.string().default('appuser'),
    MYSQL_PASSWORD: z.string().default('appsecret'),
    MYSQL_DB: z.string().default('app'),
    REDIS_HOST: z.string().default('mysql'),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().optional(),
    CACHE_TTL_SECONDS: z.coerce.number().default(60),
    KEY_PREFIX: z.string().default(''),
});


export const env = envSchema.parse(process.env);